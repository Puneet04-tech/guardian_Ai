import fs from 'fs/promises';
import path from 'path';

const FILE = path.join(process.cwd(), 'server', 'autoscan.json');

export async function getRepos(): Promise<string[]> {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.repos)) return data.repos;
  } catch (e) {
    // ignore
  }
  return [];
}

export async function saveRepos(repos: string[]) {
  const dir = path.dirname(FILE);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
  await fs.writeFile(FILE, JSON.stringify({ repos }, null, 2), 'utf8');
}

export default { getRepos, saveRepos };
