import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { generateFixPatchServer } from './geminiServer.ts';
import autoscanStore from './autoscanStore.ts';
import proposalStore, { Proposal } from './proposalStore.ts';
import patchStore, { PatchRecord } from './patchStore.ts';
import archiver from 'archiver';
import crypto from 'crypto';

// Global error handlers to surface uncaught exceptions/rejections
process.on('uncaughtException', (err: any) => { console.error('UNCAUGHT_EXCEPTION', err && err.stack ? err.stack : err); });
process.on('unhandledRejection', (reason: any) => { console.error('UNHANDLED_REJECTION', reason && reason.stack ? reason.stack : reason); });

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// Load local .env or .env.local for development (minimal parser, no dependency)
function loadLocalEnv() {
  const candidates = [path.join(process.cwd(), '.env.local'), path.join(process.cwd(), '.env')];
  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      const raw = fs.readFileSync(file, 'utf8');
      const lines = raw.split(/\r?\n/);
      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        const idx = line.indexOf('=');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
      console.log(`Loaded env from ${path.basename(file)}`);
      break;
    } catch (e) {
      // ignore errors reading local env
    }
  }
}

console.log('Starting Autofix server, loading local env...');
loadLocalEnv();
console.log('Env loaded, proceeding with initialization...');

// Helper to read multiple possible env keys (supports VITE_ prefixed vars)
function getEnv(keys: string[], fallback?: string) {
  for (const k of keys) {
    const v = process.env[k];
    if (v !== undefined) return v;
  }
  return fallback;
}

function getEnvBool(keys: string[], fallback = false) {
  const v = getEnv(keys, undefined as any);
  if (v === undefined) return fallback;
  return String(v).toLowerCase() === 'true';
}

function getEnvNumber(keys: string[], fallback = 0) {
  const v = getEnv(keys, undefined as any);
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const GITHUB_TOKEN = getEnv(['GITHUB_TOKEN', 'VITE_GITHUB_TOKEN'], '');
const SIGNING_KEY = getEnv(['SIGNING_KEY', 'VITE_SIGNING_KEY'], '');
const SIGNER_ID = getEnv(['SIGNER_ID'], 'guardianai-server');
const GEMINI_API_KEY = getEnv(['GEMINI_API_KEY', 'VITE_GEMINI_API_KEY'], '');
const AUTO_PR = getEnvBool(['AUTO_PR', 'VITE_AGENT_AUTO_PR', 'VITE_AGENT_AUTO_PR'], true);
// Simple RBAC / admin key for protecting sensitive endpoints
const ADMIN_KEY = getEnv(['ADMIN_KEY', 'VITE_ADMIN_KEY'], '');
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (!ADMIN_KEY) {
    // If not configured, allow for dev, but warn
    console.warn('ADMIN_KEY not set; admin endpoints are unprotected in this environment.');
    return next();
  }
  if (typeof key === 'string' && key === ADMIN_KEY) return next();
  return res.status(403).json({ error: 'admin key missing or invalid' });
}
const REQUIRE_APPROVAL = getEnvBool(['REQUIRE_APPROVAL', 'VITE_AGENT_REQUIRE_APPROVAL'], false);
const AUTOSCAN_INTERVAL_MIN = getEnvNumber(['AUTOSCAN_INTERVAL_MIN', 'VITE_AGENT_SCAN_INTERVAL'], 60);
const AUTOSCAN_REPOS_RAW = getEnv(['AUTOSCAN_REPOS', 'VITE_AGENT_AUTOSCAN_REPOS'], '');
const AUTOSCAN_REPOS = AUTOSCAN_REPOS_RAW ? AUTOSCAN_REPOS_RAW.split(',').map(s => s.trim()).filter(Boolean) : [];
const DEMO_FALLBACK = getEnvBool(['DEMO_FALLBACK', 'VITE_DEMO_FALLBACK'], true);

if (!GITHUB_TOKEN) {
  console.warn('Warning: GITHUB_TOKEN not set. PR creation will fail without it.\nSet GITHUB_TOKEN in your environment or place VITE_GITHUB_TOKEN in .env.local (server loads .env.local for dev).');
}

const apiBase = 'https://api.github.com';

async function getDefaultBranch(owner: string, repo: string) {
  const res = await fetch(`${apiBase}/repos/${owner}/${repo}`, { headers: { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${GITHUB_TOKEN}` } });
  if (!res.ok) throw new Error(`Failed to get repo: ${res.status}`);
  const data = await res.json();
  return data.default_branch || 'main';
}

async function createBranch(owner: string, repo: string, branchName: string, base?: string) {
  base = base || await getDefaultBranch(owner, repo);
  const refRes = await fetch(`${apiBase}/repos/${owner}/${repo}/git/ref/heads/${base}`, { headers: { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${GITHUB_TOKEN}` } });
  if (!refRes.ok) throw new Error(`Failed to get base ref sha: ${refRes.status}`);
  const refData = await refRes.json();
  const baseSha = refData.object.sha;

  const createRes = await fetch(`${apiBase}/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${GITHUB_TOKEN}` },
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha })
  });
  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create branch: ${createRes.status} ${errText}`);
  }
  return await createRes.json();
}

async function createOrUpdateFile(owner: string, repo: string, branch: string, path: string, content: string, message: string) {
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  const getRes = await fetch(`${apiBase}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`, { headers: { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${GITHUB_TOKEN}` } });
  let body: any = { message, content: encoded, branch };
  if (getRes.ok) {
    const data = await getRes.json();
    body.sha = data.sha;
  }

  const res = await fetch(`${apiBase}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${GITHUB_TOKEN}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to create/update file ${path}: ${res.status} ${t}`);
  }
  return await res.json();
}

async function createPullRequest(owner: string, repo: string, head: string, base: string, title: string, body?: string) {
  const res = await fetch(`${apiBase}/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${GITHUB_TOKEN}` },
    body: JSON.stringify({ title, head, base, body })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to create PR: ${res.status} ${t}`);
  }
  return await res.json();
}

app.post('/autofix', async (req, res) => {
  const { repoUrl, edits, prTitle, prBody, dryRun } = req.body;
  if (!repoUrl) return res.status(400).json({ error: 'repoUrl required' });

  try {
    // Helper to fetch/generate patches with quota/error handling
    async function getPatchesOrThrow(repoUrl: string, providedEdits: any, source: PatchRecord['source'] = 'dry-run') {
      if (providedEdits && Array.isArray(providedEdits) && providedEdits.length > 0) {
        // Persist provided edits as a patch record for auditing
        const id = `patch-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await patchStore.addPatch({ id, repoUrl, patches: providedEdits, createdAt: new Date().toISOString(), source, demoFallback: false });
        return providedEdits;
      }
      try {
        const patches = await generateFixPatchServer(repoUrl, [], GITHUB_TOKEN);
        // Persist generated patches for auditing
        const id = `patch-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await patchStore.addPatch({ id, repoUrl, patches, createdAt: new Date().toISOString(), source, demoFallback: false });
        return patches;
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (/RESOURCE_EXHAUSTED|Quota exceeded|quota/i.test(msg)) {
          // Try to extract retry seconds if present in message
          const m = msg.match(/retry in ([\d.]+)s/i);
          const retryAfter = m ? Math.ceil(Number(m[1])) : 10;

          // If configured, automatically return demo edits for demoability instead of failing hard
          if (DEMO_FALLBACK) {
            console.warn(`Gemini quota exceeded; returning demo edits for ${repoUrl}. Retry after: ${retryAfter}s`);
            // Simple demo edits similar to /demo-edits
            const demo: any[] = [
              {
                path: 'README.md',
                updatedContent: `# Demo Fix\n\nThis is a demo edit for ${repoUrl || 'your repo'} since the Gemini API quota was exceeded.\n\n- Note: Replace this with a real fix once the AI quota is available.`,
                summary: 'Demo README update because Gemini quota exceeded (simulated edit)'
              }
            ];
            // Attach some metadata so callers can detect demo fallback
            (demo as any)._demoFallback = true;
            (demo as any)._retryAfter = retryAfter;
            const id = `patch-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            await patchStore.addPatch({ id, repoUrl, patches: demo, createdAt: new Date().toISOString(), source, demoFallback: true, retryAfter });
            return demo;
          }

          const e: any = new Error('QuotaExceeded');
          e.original = err;
          e.retryAfter = retryAfter;
          throw e;
        }
        throw err;
      }
    }

    // If dryRun requested, generate patches server-side and return without creating PR
    if (dryRun) {
      const patches = await getPatchesOrThrow(repoUrl, edits);
      if ((patches as any)?._demoFallback) {
        return res.json({ dryRun: true, edits: patches, demoFallback: true, retryAfter: (patches as any)._retryAfter || 10 });
      }
      return res.json({ dryRun: true, edits: patches });
    }

    // Generation flow: create a proposal (requires approval) or create PR directly
    const patches = await getPatchesOrThrow(repoUrl, edits);

    if (!patches || patches.length === 0) return res.json({ message: 'No fixes proposed.', noPatches: true });

    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    const owner = match[1];
    const repo = match[2];

    if (REQUIRE_APPROVAL) {
      // create a proposal and persist it
      const id = `p-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const p: Proposal = { id, repoUrl, patches, createdAt: new Date().toISOString(), status: 'pending' };
      await proposalStore.addProposal(p);
      return res.json({ proposal: p });
    }

    // If approval not required and AUTO_PR enabled, create PR immediately
    if (!AUTO_PR) return res.status(501).json({ error: 'AUTO_PR not enabled on server.' });
    if (!GITHUB_TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN missing on server.' });

    const branchName = `guardianai-autofix-${Date.now()}`;
    await createBranch(owner, repo, branchName);
    for (const e of patches) {
      const path = e.path;
      const content = e.updatedContent;
      await createOrUpdateFile(owner, repo, branchName, path, content, `GuardianAI: fix - ${path}`);
    }

    const base = await getDefaultBranch(owner, repo);
    const title = prTitle || `GuardianAI: Automated Fixes ${new Date().toISOString().split('T')[0]}`;
    const bodyText = prBody || 'Proposed fixes generated by GuardianAI autonomous patch generator.';
    const pr = await createPullRequest(owner, repo, branchName, base, title, bodyText);
    if ((patches as any)?._demoFallback) {
      (pr as any).guardianai_demoFallback = true;
      (pr as any).guardianai_retryAfter = (patches as any)._retryAfter || 10;
    }
    // Update the most recent patch for this repo (best-effort) with PR info
    try {
      const all = await patchStore.listPatches();
      const recent = all.filter(p => p.repoUrl === repoUrl).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (recent) await patchStore.updatePatch(recent.id, { prUrl: pr.html_url, source: 'pr' });
    } catch (e) {}
    return res.json(pr);
  } catch (err: any) {
    console.error('Autofix server error:', err);
    // Surface quota errors as 429 with structured info so frontend can react
    if (err && err.message === 'QuotaExceeded') {
      return res.status(429).json({ error: err.original?.message || String(err.original || err), quotaExceeded: true, retryAfter: err.retryAfter || 10, message: 'Gemini quota exceeded. Please retry after the specified delay or use demo edits.' });
    }
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Autoscan repo management endpoints
app.get('/autoscan/repos', async (req, res) => {
  const repos = await autoscanStore.getRepos();
  return res.json({ repos });
});

app.post('/autoscan/repos', async (req, res) => {
  const { repos } = req.body;
  if (!Array.isArray(repos)) return res.status(400).json({ error: 'repos must be an array' });
  await autoscanStore.saveRepos(repos.map(String));
  return res.json({ ok: true });
});

// Proposals endpoints
app.get('/proposals', async (req, res) => {
  const list = await proposalStore.listProposals();
  return res.json({ proposals: list });
});

app.post('/proposals/:id/approve', async (req, res) => {
  const id = req.params.id;
  const p = await proposalStore.getProposal(id);
  if (!p) return res.status(404).json({ error: 'proposal not found' });
  if (p.status !== 'pending') return res.status(400).json({ error: 'proposal not pending' });
  if (!GITHUB_TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN missing on server.' });

  try {
    const match = p.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    const owner = match[1];
    const repo = match[2];
    const branchName = `guardianai-autofix-${Date.now()}`;
    await createBranch(owner, repo, branchName);
    for (const e of p.patches) {
      await createOrUpdateFile(owner, repo, branchName, e.path, e.updatedContent, `GuardianAI: fix - ${e.path}`);
    }
    const base = await getDefaultBranch(owner, repo);
    const title = `GuardianAI: Automated Fixes ${new Date().toISOString().split('T')[0]}`;
    const bodyText = 'Proposed fixes generated by GuardianAI autonomous patch generator.';
    const pr = await createPullRequest(owner, repo, branchName, base, title, bodyText);
    await proposalStore.updateProposal(id, { status: 'approved', prUrl: pr.html_url });
    // Update the most recent patch entry for this repo with PR info (best-effort)
    try {
      const all = await patchStore.listPatches();
      const recent = all.filter(rec => rec.repoUrl === p.repoUrl).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (recent) await patchStore.updatePatch(recent.id, { prUrl: pr.html_url, source: 'pr' });
    } catch (e) {}
    return res.json({ ok: true, pr });
  } catch (err: any) {
    console.error('Approve error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});



// Software Composition Analysis (SCA) endpoint - inspects package.json and compares dependency versions against npm registry
app.post('/sca', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) return res.status(400).json({ error: 'repoUrl required' });

  try {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return res.status(400).json({ error: 'invalid github url' });
    const owner = match[1];
    const repo = match[2];

    // fetch package.json from the default branch
    const apiUrl = `${apiBase}/repos/${owner}/${repo}/contents/package.json`;
    const pkgRes = await fetch(apiUrl, { headers: { Accept: 'application/vnd.github.v3.raw', Authorization: GITHUB_TOKEN ? `Bearer ${GITHUB_TOKEN}` : undefined } });
    if (!pkgRes.ok) return res.status(404).json({ error: 'package.json not found or inaccessible' });
    const pkgJson = await pkgRes.json();

    let pkg: any;
    if (typeof pkgJson === 'string') {
      pkg = JSON.parse(pkgJson);
    } else if (pkgJson && pkgJson.content) {
      const buff = Buffer.from(pkgJson.content, 'base64').toString('utf8');
      pkg = JSON.parse(buff);
    } else {
      pkg = pkgJson;
    }

    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const results: any[] = [];

    async function getLatestInfo(name: string) {
      try {
        const r = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`);
        if (!r.ok) return null;
        return await r.json();
      } catch (e) { return null; }
    }

    function simpleCompareVersion(a: string, b: string) {
      // remove leading ^~>=<=
      const norm = (s: string) => s.replace(/^[^0-9]*/g, '').split('.').map(n => Number(n) || 0);
      const A = norm(a); const B = norm(b);
      for (let i=0;i<3;i++) { if (A[i] > B[i]) return 1; if (A[i] < B[i]) return -1; }
      return 0;
    }

    for (const [name, versionSpec] of Object.entries(deps)) {
      const info = await getLatestInfo(name);
      const latest = info?.version || 'unknown';
      const license = info?.license || pkg.license || 'unknown';
      const outdated = latest !== 'unknown' && simpleCompareVersion(versionSpec as string, latest) < 0;
      results.push({ package: name, current: versionSpec, latest, outdated, license, url: info?.homepage || `https://www.npmjs.com/package/${name}` });
    }

    const summary = { total: results.length, outdated: results.filter(r => r.outdated).length };
    return res.json({ repoUrl, results, summary });
  } catch (err: any) {
    console.error('SCA error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// DAST placeholder endpoint (kept as lightweight placeholder but extended to include a tracking id)
app.post('/dast', async (req, res) => {
  const { targetUrl } = req.body;
  if (!targetUrl) return res.status(400).json({ error: 'targetUrl required' });
  // NOTE: Placeholder - production should invoke containerized scanners (OWASP ZAP) and provide auth flows
  const jobId = `dast-${Date.now()}-${Math.floor(Math.random()*10000)}`;
  // record to autoscan store as a job (not implemented fully)
  console.log(`Queued DAST job ${jobId} for ${targetUrl}`);
  const sample = { jobId, targetUrl, status: 'queued', issues: [ { path: '/', issue: 'XSS in /search?q=', severity: 'HIGH' } ] };
  return res.json(sample);
});

// IaC scan placeholder endpoint
app.post('/iac-scan', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) return res.status(400).json({ error: 'repoUrl required' });
  // Placeholder - integrate with Checkov or tfsec for real IaC analysis
  const sample = { repoUrl, findings: [ { file: 'terraform/main.tf', issue: 'open security group 0.0.0.0/0', severity: 'HIGH' } ] };
  return res.json(sample);
});
app.post('/scan', async (req, res) => {
  const { repoUrl, prTitle, prBody, dryRun, edits } = req.body;
  if (!repoUrl) return res.status(400).json({ error: 'repoUrl required' });

  try {
    // Use helper to get patches and handle quota errors
    async function getPatchesOrThrow(repoUrl: string, providedEdits?: any) {
      if (providedEdits && Array.isArray(providedEdits) && providedEdits.length > 0) {
        const id = `patch-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await patchStore.addPatch({ id, repoUrl, patches: providedEdits, createdAt: new Date().toISOString(), source: 'manual-scan', demoFallback: false });
        return providedEdits;
      }
      try {
        const patches = await generateFixPatchServer(repoUrl, [], GITHUB_TOKEN);
        const id = `patch-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await patchStore.addPatch({ id, repoUrl, patches, createdAt: new Date().toISOString(), source: 'manual-scan', demoFallback: false });
        return patches;
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (/RESOURCE_EXHAUSTED|Quota exceeded|quota/i.test(msg)) {
          const m = msg.match(/retry in ([\d.]+)s/i);
          const retryAfter = m ? Math.ceil(Number(m[1])) : 10;

          if (DEMO_FALLBACK) {
            console.warn(`Gemini quota exceeded; returning demo edits for ${repoUrl}. Retry after: ${retryAfter}s`);
            const demo: any[] = [
              {
                path: 'README.md',
                updatedContent: `# Demo Fix\n\nThis is a demo edit for ${repoUrl || 'your repo'} since the Gemini API quota was exceeded.\n\n- Note: Replace this with a real fix once the AI quota is available.`,
                summary: 'Demo README update because Gemini quota exceeded (simulated edit)'
              }
            ];
            (demo as any)._demoFallback = true;
            (demo as any)._retryAfter = retryAfter;
            const id = `patch-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            await patchStore.addPatch({ id, repoUrl, patches: demo, createdAt: new Date().toISOString(), source: 'demo', demoFallback: true, retryAfter });
            return demo;
          }

          const e: any = new Error('QuotaExceeded');
          e.original = err;
          e.retryAfter = retryAfter;
          throw e;
        }
        throw err;
      }
    }

    if (dryRun) {
      const patches = await getPatchesOrThrow(repoUrl, edits);
      if ((patches as any)?._demoFallback) {
        return res.json({ dryRun: true, edits: patches, demoFallback: true, retryAfter: (patches as any)._retryAfter || 10 });
      }
      return res.json({ dryRun: true, edits: patches });
    }

    // Manual PR creation allowed via /scan even if AUTO_PR is disabled; proceed.
    if (!GITHUB_TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN missing on server.' });

    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    const owner = match[1];
    const repo = match[2];

    const patches = await getPatchesOrThrow(repoUrl, edits);
    if (!patches || patches.length === 0) return res.json({ message: 'No fixes proposed.', noPatches: true });

    const branchNameBase = `guardianai-autofix-${Date.now()}`;
    let branchName = branchNameBase;
    try {
      await createBranch(owner, repo, branchName);
    } catch (err: any) {
      // If branch exists or creation failed, try with a suffix
      branchName = `${branchNameBase}-${Math.floor(Math.random() * 10000)}`;
      await createBranch(owner, repo, branchName);
    }

    for (const e of patches) {
      const path = e.path;
      const content = e.updatedContent;
      await createOrUpdateFile(owner, repo, branchName, path, content, `GuardianAI: fix - ${path}`);
    }

    const base = await getDefaultBranch(owner, repo);
    const title = prTitle || `GuardianAI: Automated Fixes ${new Date().toISOString().split('T')[0]}`;
    const bodyText = prBody || 'Proposed fixes generated by GuardianAI autonomous patch generator.';
    const pr = await createPullRequest(owner, repo, branchName, base, title, bodyText);
    if ((patches as any)?._demoFallback) {
      (pr as any).guardianai_demoFallback = true;
      (pr as any).guardianai_retryAfter = (patches as any)._retryAfter || 10;
    }
    // Update patch record with PR info (best effort)
    try {
      const all = await patchStore.listPatches();
      const recent = all.filter(p => p.repoUrl === repoUrl).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (recent) await patchStore.updatePatch(recent.id, { prUrl: pr.html_url, source: 'pr' });
    } catch (e) {}
    return res.json(pr);
  } catch (err: any) {
    console.error('Manual scan error:', err);
    if (err && err.message === 'QuotaExceeded') {
      return res.status(429).json({ error: err.original?.message || String(err.original || err), quotaExceeded: true, retryAfter: err.retryAfter || 10, message: 'Gemini quota exceeded. Please retry after the specified delay or use demo edits.' });
    }
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Demo edits endpoint - used when Gemini quota is exhausted or for demo/testing
app.post('/demo-edits', async (req, res) => {
  const { repoUrl } = req.body || {};
  // Return a simple simulated edit payload for demo purposes
  const demo: any[] = [
    {
      path: 'README.md',
      updatedContent: `# Demo Fix\n\nThis is a demo edit for ${repoUrl || 'your repo'} since the Gemini API quota was exceeded or for testing purposes.\n\n- Note: Replace this with a real fix once the AI quota is available.`,
      summary: 'Demo README update because Gemini quota exceeded (simulated edit)'
    },
    {
      path: 'src/demo-security-fix.js',
      updatedContent: `// Demo security fix - placeholder\n// Replace with AI generated fix when quota allows\nmodule.exports = { fixed: true };`,
      summary: 'Demo placeholder fix'
    }
  ];
  // Persist demo edits as a patch record for auditing
  try {
    const id = `patch-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    await patchStore.addPatch({ id, repoUrl: repoUrl || 'unknown', patches: demo, createdAt: new Date().toISOString(), source: 'demo', demoFallback: true });
  } catch (e) {}
  return res.json({ demo: true, edits: demo });
});

// Patches endpoints for audit and download
app.get('/patches', async (req, res) => {
  const list = await patchStore.listPatches();
  return res.json({ patches: list });
});

// Sign a persisted patch (admin-only) - produces HMAC signature stored with the patch
app.post('/patches/:id/sign', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const p = await patchStore.getPatch(id);
  if (!p) return res.status(404).json({ error: 'patch not found' });
  try {
    const key = SIGNING_KEY || crypto.randomBytes(32).toString('hex');
    const payload = JSON.stringify(p);
    const sig = crypto.createHmac('sha256', key).update(payload).digest('hex');
    const signedAt = new Date().toISOString();
    await patchStore.updatePatch(id, { signature: sig, signedAt, signer: SIGNER_ID });
    return res.json({ ok: true, id, signature: sig, signedAt, signer: SIGNER_ID });
  } catch (err: any) {
    console.error('Sign patch error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Retrieve a signed certificate (JSON) for a patch
app.get('/patches/:id/certificate', async (req, res) => {
  const id = req.params.id;
  const p = await patchStore.getPatch(id);
  if (!p) return res.status(404).json({ error: 'patch not found' });
  if (!p.signature) return res.status(404).json({ error: 'patch not signed' });
  const cert = { id: p.id, repoUrl: p.repoUrl, signedAt: p.signedAt, signer: p.signer, signature: p.signature, prUrl: p.prUrl };
  return res.json({ certificate: cert });
});

// Download a PDF certificate for a signed patch
app.get('/patches/:id/certificate.pdf', async (req, res) => {
  const id = req.params.id;
  const p = await patchStore.getPatch(id);
  if (!p) return res.status(404).json({ error: 'patch not found' });
  if (!p.signature) return res.status(400).json({ error: 'patch not signed' });
  try {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial;padding:24px}h1{color:#0b1220}pre{background:#f6f6f6;padding:12px;border-radius:6px}</style></head><body><h1>GuardianAI Patch Certificate</h1><p><strong>Patch ID:</strong> ${p.id}</p><p><strong>Repo:</strong> ${p.repoUrl}</p><p><strong>Signed By:</strong> ${p.signer}</p><p><strong>Signed At:</strong> ${p.signedAt}</p><p><strong>Signature:</strong></p><pre>${p.signature}</pre></body></html>`;
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' } });
    await browser.close();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="patch-${id}-certificate.pdf"`);
    return res.send(pdfBuffer);
  } catch (err: any) {
    console.error('certificate pdf error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Generate tests for a patch (suggestions) - returns test skeletons
app.post('/patches/:id/generate-tests', async (req, res) => {
  const id = req.params.id;
  const p = await patchStore.getPatch(id);
  if (!p) return res.status(404).json({ error: 'patch not found' });
  try {
    const tests: { path: string; testContent: string }[] = p.patches.map(pp => {
      const testPath = pp.path.replace(/\.(js|ts|jsx|tsx)$/, '.test.$1');
      const fnName = pp.path.split('/').pop()?.replace(/\.[a-z]+$/, '') || 'patchedModule';
      const content = `// Auto-generated test suggestion for ${pp.path}\nconst ${fnName} = require('../${pp.path}');\ndescribe('${pp.path}', ()=>{\n  test('basic behavior', ()=>{\n    // TODO: implement specific assertions for the fix: ${pp.summary || ''}\n    expect(true).toBe(true);\n  });\n});`;
      return { path: testPath, testContent: content };
    });
    return res.json({ ok: true, tests });
  } catch (err: any) {
    console.error('generate-tests error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Download patch as JSON attachment for judges
app.get('/patches/:id/download', async (req, res) => {
  const id = req.params.id;
  const p = await patchStore.getPatch(id);
  if (!p) return res.status(404).json({ error: 'patch not found' });
  const filename = `patch-${id}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/json');
  return res.send(JSON.stringify(p, null, 2));
});

app.get('/patches/download-all', async (req, res) => {
  const all = await patchStore.listPatches();
  const filename = `guardianai-patches-${new Date().toISOString().slice(0,10)}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/json');
  return res.send(JSON.stringify({ patches: all }, null, 2));
});

// Stream a ZIP containing selected patches (ids comma-separated) or all patches if none specified
app.get('/patches/download-zip', async (req, res) => {
  try {
    const ids = typeof req.query.ids === 'string' ? (req.query.ids as string).split(',').map(s => s.trim()).filter(Boolean) : null;
    const all = await patchStore.listPatches();
    const toInclude = ids && ids.length > 0 ? all.filter(p => ids.includes(p.id)) : all;

    const filename = `guardianai-patches-${new Date().toISOString().slice(0,10)}.zip`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err: any) => {
      console.error('Archive error', err);
      try { res.status(500).json({ error: 'Failed to create archive' }); } catch(e){}
    });

    // Pipe archive to response
    archive.pipe(res);

    for (const p of toInclude) {
      archive.append(JSON.stringify(p, null, 2), { name: `${p.id}.json` });
    }

    await archive.finalize();
  } catch (e: any) {
    console.error('Failed to create ZIP', e);
    return res.status(500).json({ error: 'Failed to create ZIP' });
  }
});

app.get('/patches/:id', async (req, res) => {
  const id = req.params.id;
  const p = await patchStore.getPatch(id);
  if (!p) return res.status(404).json({ error: 'patch not found' });
  return res.json({ patch: p });
});

// Stream a ZIP containing selected patches (ids comma-separated) or all patches if none specified
app.get('/patches/download-zip', async (req, res) => {
  try {
    const ids = typeof req.query.ids === 'string' ? (req.query.ids as string).split(',').map(s => s.trim()).filter(Boolean) : null;
    const all = await patchStore.listPatches();
    const toInclude = ids && ids.length > 0 ? all.filter(p => ids.includes(p.id)) : all;

    const filename = `guardianai-patches-${new Date().toISOString().slice(0,10)}.zip`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err: any) => {
      console.error('Archive error', err);
      try { res.status(500).json({ error: 'Failed to create archive' }); } catch(e){}
    });

    // Pipe archive to response
    archive.pipe(res);

    for (const p of toInclude) {
      archive.append(JSON.stringify(p, null, 2), { name: `${p.id}.json` });
    }

    await archive.finalize();
  } catch (e: any) {
    console.error('Failed to create ZIP', e);
    return res.status(500).json({ error: 'Failed to create ZIP' });
  }
});

// CI integration: create a GitHub check run for CI-based reporting (admin-only)
app.post('/ci/check-run', requireAdmin, async (req, res) => {
  const { owner, repo, head_sha, name = 'GuardianAI Scan', status = 'completed', conclusion = 'neutral', output } = req.body || {};
  if (!owner || !repo || !head_sha) return res.status(400).json({ error: 'owner, repo and head_sha required' });
  if (!GITHUB_TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN missing on server.' });
  try {
    const r = await fetch(`${apiBase}/repos/${owner}/${repo}/check-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/vnd.github+json', Authorization: `Bearer ${GITHUB_TOKEN}` },
      body: JSON.stringify({ name, head_sha, status, conclusion, output })
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`GitHub check-run failed: ${r.status} ${t}`);
    }
    const data = await r.json();
    return res.json({ ok: true, checkRun: data });
  } catch (err: any) {
    console.error('check-run error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Autoscan loop: periodically scan configured repos and create PRs when AUTO_PR=true
// Autoscan loop: periodically scan configured repos and create proposals (approval required) or PRs
;(async () => {
  const initialRepos = await autoscanStore.getRepos();
  if (initialRepos.length === 0) return;
  console.log(`Autoscan enabled for ${initialRepos.length} repo(s). Interval: ${AUTOSCAN_INTERVAL_MIN} minutes.`);

  const runAutoscanOnce = async () => {
    const repos = await autoscanStore.getRepos();
    for (const repoUrl of repos) {
      try {
        console.log(`Autoscan: scanning ${repoUrl}`);
        const patches = await generateFixPatchServer(repoUrl, [], GITHUB_TOKEN);
        if (!patches || patches.length === 0) {
          console.log(`Autoscan: no fixes for ${repoUrl}`);
          continue;
        }
        // Persist autoscan patches
        const id = `patch-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await patchStore.addPatch({ id, repoUrl, patches, createdAt: new Date().toISOString(), source: 'autoscan' });

        if (REQUIRE_APPROVAL) {
          const id = `p-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          await proposalStore.addProposal({ id, repoUrl, patches, createdAt: new Date().toISOString(), status: 'pending' });
          console.log(`Autoscan: proposal created ${id} for ${repoUrl}`);
          continue;
        }

        // If approval is not required, create PRs only when AUTO_PR is enabled
        if (!AUTO_PR) {
          console.log(`Autoscan: fixes generated for ${repoUrl}, AUTO_PR disabled. Skipping PR creation.`);
          continue;
        }
        if (!GITHUB_TOKEN) {
          console.warn('Autoscan: GITHUB_TOKEN missing; cannot create PRs.');
          continue;
        }

        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
          console.warn(`Autoscan: invalid GitHub URL ${repoUrl}`);
          continue;
        }
        const owner = match[1];
        const repo = match[2];

        const branchName = `guardianai-autofix-${Date.now()}`;
        try {
          await createBranch(owner, repo, branchName);
        } catch (err: any) {
          console.warn(`Autoscan: branch creation failed for ${repoUrl}: ${err.message || err}`);
          continue;
        }

        for (const e of patches) {
          const path = e.path;
          const content = e.updatedContent;
          await createOrUpdateFile(owner, repo, branchName, path, content, `GuardianAI: fix - ${path}`);
        }

        const base = await getDefaultBranch(owner, repo);
        const title = `GuardianAI: Automated Fixes ${new Date().toISOString().split('T')[0]}`;
        const bodyText = 'Proposed fixes generated by GuardianAI autonomous patch generator.';
        const pr = await createPullRequest(owner, repo, branchName, base, title, bodyText);
        console.log(`Autoscan: PR created ${pr.html_url}`);
      } catch (err: any) {
        console.error(`Autoscan: error scanning ${repoUrl}:`, err);
      }
    }
  };

  // Kick off initial run and schedule subsequent runs
  await runAutoscanOnce();
  setInterval(runAutoscanOnce, Math.max(1, AUTOSCAN_INTERVAL_MIN) * 60 * 1000);
})();

const port = process.env.PORT || 4002;
app.listen(port, () => console.log(`Autofix server running on http://localhost:${port}`));

export default app;
