import fs from 'fs/promises';
import path from 'path';

const FILE = path.join(process.cwd(), 'server', 'patches.json');
console.log('Loaded patchStore module');

export interface PatchRecord {
  id: string;
  repoUrl: string;
  patches: Array<{ path: string; updatedContent: string; summary?: string }>;
  createdAt: string;
  source: 'dry-run' | 'manual-scan' | 'autoscan' | 'proposal' | 'pr' | 'demo';
  demoFallback?: boolean;
  retryAfter?: number;
  prUrl?: string;
  // Signature fields for auditable proof
  signature?: string; // hex-encoded HMAC or signature
  signedAt?: string;  // ISO timestamp
  signer?: string;    // signer identifier (server id)
}

async function readAll(): Promise<PatchRecord[]> {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.patches)) return data.patches as PatchRecord[];
  } catch (e) {}
  return [];
}

async function writeAll(list: PatchRecord[]) {
  const dir = path.dirname(FILE);
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
  await fs.writeFile(FILE, JSON.stringify({ patches: list }, null, 2), 'utf8');
}

export async function listPatches(): Promise<PatchRecord[]> {
  return await readAll();
}

export async function addPatch(p: PatchRecord) {
  const all = await readAll();
  all.push(p);
  console.log(`patchStore: adding patch ${p.id} for ${p.repoUrl} (patches now: ${all.length})`);
  await writeAll(all);
}

export async function getPatch(id: string): Promise<PatchRecord | undefined> {
  const all = await readAll();
  return all.find(x => x.id === id);
}

export async function updatePatch(id: string, patch: Partial<PatchRecord>) {
  const all = await readAll();
  const idx = all.findIndex(x => x.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...patch } as PatchRecord;
  await writeAll(all);
}

export default { listPatches, addPatch, getPatch, updatePatch };