import React, { useEffect, useState } from 'react';

export default function PatchList({ onClose }: { onClose: () => void }) {
  const [patches, setPatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => { fetchPatches(); }, []);

  const fetchPatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/patches');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPatches(data.patches || []);
    } catch (e: any) {
      console.error('Failed to fetch patches', e);
      alert('Failed to fetch patches: ' + (e.message || e));
    } finally { setLoading(false); }
  };

  const downloadJson = (id: string, filename?: string) => {
    const url = `/api/patches/${encodeURIComponent(id)}/download`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `patch-${id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadZipAll = () => {
    const url = `/api/patches/download-zip`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `guardianai-patches.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadZipSelected = (id?: string) => {
    const url = id ? `/api/patches/download-zip?ids=${encodeURIComponent(id)}` : `/api/patches/download-zip`;
    const a = document.createElement('a');
    a.href = url;
    a.download = id ? `patch-${id}.zip` : `guardianai-patches.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full p-6 text-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Saved Patches</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadZipAll()} className="px-2 py-1 bg-amber-600 rounded text-sm">Download ZIP</button>
            <button onClick={onClose} className="text-slate-400 hover:text-white">Close</button>
          </div>
        </div>

        <div className="mt-4">
          {loading ? <div>Loading…</div> : (
            <div className="grid grid-cols-1 gap-2">
              {patches.length === 0 && <div className="text-slate-400">No patches recorded yet.</div>}
              {patches.map(p => (
                <div key={p.id} className="p-3 bg-slate-800 rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.repoUrl}</div>
                    <div className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleString()} • {p.source} {p.demoFallback ? '• demo' : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelected(p)} className="px-2 py-1 bg-slate-700 rounded text-sm">View</button>
                    <button onClick={() => downloadJson(p.id)} className="px-2 py-1 bg-slate-700 rounded text-sm">Download JSON</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="mt-4 bg-slate-800 p-3 rounded">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{selected.repoUrl}</div>
                <div className="text-xs text-slate-400">{new Date(selected.createdAt).toLocaleString()} • {selected.source}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => downloadJson(selected.id)} className="px-2 py-1 bg-slate-700 rounded text-sm">Download JSON</button>
                <button onClick={() => downloadZipSelected(selected.id)} className="px-2 py-1 bg-amber-600 rounded text-sm">Download ZIP</button>
                <button onClick={() => setSelected(null)} className="px-2 py-1 bg-slate-700 rounded text-sm">Close</button>
              </div>
            </div>

            <div className="mt-3 space-y-4">
              {selected.patches.map((f: any) => (
                <div key={f.path} className="bg-slate-900 p-3 rounded">
                  <div className="font-medium">{f.path} <span className="text-xs text-slate-400">{f.summary || ''}</span></div>
                  <pre className="mt-2 text-xs bg-slate-800 p-2 rounded overflow-auto">{f.updatedContent}</pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
