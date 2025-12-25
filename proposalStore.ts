import fs from 'fs/promises';
import path from 'path';

const FILE = path.join(process.cwd(), 'server', 'proposals.json');

export interface Proposal {
  id: string;
  repoUrl: string;
  patches: Array<{ path: string; updatedContent: string; summary?: string }>;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  prUrl?: string;
}

async function readAll(): Promise<Proposal[]> {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.proposals)) return data.proposals as Proposal[];
  } catch (e) {}
  return [];
}

async function writeAll(list: Proposal[]) {
  const dir = path.dirname(FILE);
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
  await fs.writeFile(FILE, JSON.stringify({ proposals: list }, null, 2), 'utf8');
}

export async function listProposals(): Promise<Proposal[]> {
  return await readAll();
}

export async function addProposal(p: Proposal) {
  const all = await readAll();
  all.push(p);
  await writeAll(all);
}

export async function getProposal(id: string): Promise<Proposal | undefined> {
  const all = await readAll();
  return all.find(x => x.id === id);
}

export async function updateProposal(id: string, patch: Partial<Proposal>) {
  const all = await readAll();
  const idx = all.findIndex(x => x.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...patch } as Proposal;
  await writeAll(all);
}

export default { listProposals, addProposal, getProposal, updateProposal };
