import { GoogleGenAI } from "@google/genai";
import fetch from 'node-fetch';
import { exec as _exec } from 'child_process';
import { promisify } from 'util';

const exec = promisify(_exec);

let genAI: any = null;
console.log('Loaded geminiServer module');

// Lazily initialize GoogleGenAI so server can load .env.local before we read env vars
const ensureGenAI = () => {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!key) return null;
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
};

const USE_GEMINI_CLI = (process.env.USE_GEMINI_CLI === 'true' || process.env.VITE_USE_GEMINI_CLI === 'true');
const GCLOUD_PROJECT = process.env.VITE_VERTEX_PROJECT_ID || process.env.VITE_GCLOUD_PROJECT || process.env.GCLOUD_PROJECT || '';
const GCLOUD_LOCATION = process.env.VITE_VERTEX_LOCATION || process.env.VITE_GCLOUD_LOCATION || process.env.GCLOUD_LOCATION || 'us-central1';

async function callGeminiCli(systemPrompt: string, userPrompt: string, jsonMode: boolean = false) {
  const prompt = `${systemPrompt}\n\n${userPrompt}`;
  const finalPrompt = jsonMode ? `${prompt}\n\nIMPORTANT: Respond with ONLY valid JSON. No additional text or markdown.` : prompt;
  const payload = JSON.stringify({ instances: [{ content: finalPrompt }] });

  // Candidate command variants to try (aligned with Google Cloud CLI patterns)
  const candidates = [
    // gcloud ai models predict --model=gemini-2.5-flash --region=... --project=... --json-request='{"instances":[{"content":"..."}]}' --format=json
    [`gcloud`, `ai`, `models`, `predict`, `--model=gemini-2.5-flash`, `--region=${GCLOUD_LOCATION}`, GCLOUD_PROJECT ? `--project=${GCLOUD_PROJECT}` : '', `--json-request=${payload}`, `--format=json`],
    // gcloud alpha ai models predict (alpha/beta may expose the same command)
    [`gcloud`, `alpha`, `ai`, `models`, `predict`, `--model=gemini-2.5-flash`, `--region=${GCLOUD_LOCATION}`, GCLOUD_PROJECT ? `--project=${GCLOUD_PROJECT}` : '', `--json-request=${payload}`, `--format=json`],
    // gcloud ai generate-text --model=gemini-2.5-flash --input='...' --location=... --project=...
    [`gcloud`, `ai`, `generate-text`, `--model=gemini-2.5-flash`, `--location=${GCLOUD_LOCATION}`, GCLOUD_PROJECT ? `--project=${GCLOUD_PROJECT}` : '', `--input=${JSON.stringify(finalPrompt)}`, `--format=json`]
  ];

  for (const parts of candidates) {
    const cmd = parts.filter(Boolean).join(' ');
    try {
      const { stdout, stderr } = await exec(cmd, { timeout: 20000, maxBuffer: 10 * 1024 * 1024 });
      if (!stdout || stdout.trim().length === 0) {
        // Try next candidate
        continue;
      }
      // Some gcloud outputs JSON with logs; try to extract the first JSON object or string
      const out = stdout.trim();
      // Attempt to parse JSON
      try {
        const parsed = JSON.parse(out);
        // Response shape varies; try to find text content
        // Example: { predictions: [ { content: '...' } ] } or other shapes
        let text = '';
        if (parsed.predictions && Array.isArray(parsed.predictions) && parsed.predictions[0]) {
          text = parsed.predictions[0].content || parsed.predictions[0].text || JSON.stringify(parsed.predictions[0]);
        } else if (parsed[0] && parsed[0].content) {
          text = parsed[0].content;
        } else if (parsed.text) {
          text = parsed.text;
        } else {
          text = out;
        }
        console.log('Gemini CLI: command succeeded, using CLI output.');
        return String(text || out);
      } catch (e) {
        // Not JSON — return raw text
        console.log('Gemini CLI: command succeeded, raw output used.');
        return out;
      }
    } catch (e: any) {
      // gcloud not found or command failed; try next
      // Log for diagnostics but don't crash
      console.warn('gcloud candidate failed:', { cmd, reason: e?.message || e, stderr: (e?.stderr || '').toString?.() });
      continue;
    }
  }
  throw new Error('GCloudCLIUnavailable');
}

const callGeminiServer = async (systemPrompt: string, userPrompt: string, jsonMode: boolean = false) => {
  // Try CLI if enabled and available; fallback to SDK
  if (USE_GEMINI_CLI) {
    try {
      const s = await callGeminiCli(systemPrompt, userPrompt, jsonMode);
      return s;
    } catch (e) {
      console.warn('Gemini CLI failed or unavailable, falling back to SDK:', e?.message || e);
    }
  }

  const client = ensureGenAI();
  if (!client) throw new Error('GEMINI_MISSING');
  const prompt = `${systemPrompt}\n\n${userPrompt}`;
  const finalPrompt = jsonMode ? `${prompt}\n\nIMPORTANT: Respond with ONLY valid JSON. No additional text or markdown.` : prompt;
  const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: finalPrompt, config: { temperature: 0.2, maxOutputTokens: 8192 } });
  return response.text || '';
};

const fetchText = async (baseUrl: string, path: string, headers: any) => {
  try {
    const res = await fetch(`${baseUrl}/contents/${path}`, { headers });
    if (!res.ok) return '';
    const data = await res.json();
    return Buffer.from(data.content, 'base64').toString('utf8');
  } catch (e) { return ''; }
};

const fetchGitHubContextServer = async (repoUrl: string, githubToken?: string) => {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  const owner = match[1];
  const repo = match[2];
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const headers: any = { Accept: 'application/vnd.github.v3+json' };
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

  const readme = await fetchText(baseUrl, 'README.md', headers);
  const packageJson = await fetchText(baseUrl, 'package.json', headers);

  // fetch tree
  let fileList: string[] = [];
  try {
    let treeRes = await fetch(`${baseUrl}/git/trees/main?recursive=1`, { headers });
    if (!treeRes.ok) treeRes = await fetch(`${baseUrl}/git/trees/master?recursive=1`, { headers });
    const data = await treeRes.json();
    if (data && data.tree) fileList = data.tree.filter((i: any) => i.type === 'blob').map((i: any) => i.path);
  } catch (e) { }

  const criticalFiles: { path: string, content: string }[] = [];
  const candidates = fileList.slice(0, 50);
  for (const p of candidates) {
    const content = await fetchText(baseUrl, p, headers);
    if (content) criticalFiles.push({ path: p, content: content.substring(0, 3500) });
  }

  return { readme, packageJson, structure: fileList.join('\n'), recentCommits: [], criticalFiles };
};

export const generateFixPatchServer = async (repoUrl: string, findings: any[], githubToken?: string) => {
  const context = await fetchGitHubContextServer(repoUrl, githubToken);
  const systemPrompt = `You are CodeFixer, an AI assistant that returns ONLY valid JSON. For each issue described in the user prompt, modify the relevant file content and return an array of objects {"path":"path/to/file","updatedContent":"<full file content after fix>", "summary":"short description of change"}. Do NOT include any other text.`;
  const filesBlock = context.criticalFiles.map(f => `FILE: ${f.path}\n---\n${f.content}`).join('\n\n');
  const userPrompt = `REPO: ${repoUrl}\n\nISSUES:\n${JSON.stringify(findings, null, 2).substring(0, 6000)}\n\nFILES:\n${filesBlock.substring(0, 12000)}\n\nFor each issue, return the complete updated file content (not a diff).`;
  const jsonText = await callGeminiServer(systemPrompt, userPrompt, true);
  let clean = jsonText.trim().replace(/^```json\s*/g, '').replace(/^```\s*/g, '').replace(/```\s*$/g, '').trim();
  const jsonStart = clean.indexOf('[');
  const jsonEnd = clean.lastIndexOf(']');
  if (jsonStart !== -1 && jsonEnd !== -1) clean = clean.substring(jsonStart, jsonEnd + 1);
  const parsed = JSON.parse(clean);
  const edits = parsed.map((p: any) => ({ path: p.path, updatedContent: p.updatedContent || p.content || '', summary: p.summary || '' })).filter((e: any) => e.path && e.updatedContent);
  return edits;
};

export default { generateFixPatchServer };
