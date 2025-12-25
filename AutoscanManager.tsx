import React, { useEffect, useState } from 'react';

const AutoscanManager: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [repos, setRepos] = useState<string[]>([]);
  const [newRepo, setNewRepo] = useState('');
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchRepos();
    fetchProposals();
  }, [open]);

  async function fetchRepos() {
    try {
      const res = await fetch('/api/autoscan/repos');
      const data = await res.json();
      setRepos(data.repos || []);
    } catch (e) { console.error(e); }
  }

  async function saveRepos(list: string[]) {
    setLoading(true);
    try {
      await fetch('/api/autoscan/repos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repos: list }) });
      setRepos(list);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchProposals() {
    try {
      const res = await fetch('/api/proposals');
      const data = await res.json();
      setProposals(data.proposals || []);
    } catch (e) { console.error(e); }
  }

  async function approve(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/proposals/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      await fetchProposals();
      alert('Proposal approved and PR created.');
    } catch (e: any) {
      console.error(e);
      alert('Approve failed: ' + (e.message || e));
    }
    setLoading(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-6">
      <div className="bg-[#0b1220] rounded-xl shadow-2xl max-w-4xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold">Autoscan Manager</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white">Close</button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold mb-2">Managed Repositories</h5>
            <div className="space-y-2 mb-3">
              {repos.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-[#07121a] p-2 rounded">
                  <div className="text-sm text-slate-200 truncate">{r}</div>
                  <button onClick={() => { const next = repos.filter(x => x !== r); saveRepos(next); }} className="text-red-400 text-sm">Remove</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newRepo} onChange={e => setNewRepo(e.target.value)} placeholder="https://github.com/owner/repo" className="flex-1 px-3 py-2 bg-[#07121a] rounded" />
              <button onClick={() => { if (!newRepo) return; const next = [...repos, newRepo]; saveRepos(next); setNewRepo(''); }} className="bg-blue-600 px-3 py-2 rounded">Add</button>
            </div>
          </div>
          <div>
            <h5 className="font-semibold mb-2">Pending Proposals</h5>
            <div className="space-y-2 max-h-64 overflow-auto">
              {proposals.length === 0 && <div className="text-slate-400">No proposals</div>}
              {proposals.map(p => (
                <div key={p.id} className="bg-[#07121a] p-3 rounded">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-slate-200 font-semibold">{p.repoUrl}</div>
                      <div className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleString()}</div>
                      <div className="mt-2 text-xs text-slate-300">{p.patches?.length || 0} file(s) proposed</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => approve(p.id)} disabled={loading} className="bg-emerald-600 px-3 py-1 rounded text-sm">Approve</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoscanManager;
