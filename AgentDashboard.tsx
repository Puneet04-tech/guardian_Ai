import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Github, Rocket, Sparkles } from "lucide-react";
import AutoscanManager from './AutoscanManager';

// Simple modal component
const Modal: React.FC<{ open: boolean; onClose: () => void; title?: string }> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[#0b1220] rounded-xl shadow-2xl max-w-3xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold">{title}</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white">Close</button>
        </div>
        <div className="max-h-[60vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
};

const AgentDashboard = (props: any) => {
  const [repoUrl, setRepoUrl] = useState("");
  // If parent passes a repoUrl prop, use it as initial value
  React.useEffect(() => {
    if (props && props.repoUrl) setRepoUrl(props.repoUrl);
  }, [props && props.repoUrl]);
  const [agentMode, setAgentMode] = useState("manual");
  const [nextScanIn] = useState(15);
  const [totalScansToday] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoscanOpen, setAutoscanOpen] = useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [autofixLoading, setAutofixLoading] = useState(false);
  const [autofixResults, setAutofixResults] = useState<{ path: string; updatedContent: string; summary?: string }[] | null>(null);
  const [autofixModalOpen, setAutofixModalOpen] = useState(false);
  const [prLoading, setPrLoading] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [prModalOpen, setPrModalOpen] = useState(false);
  const [prOptionsOpen, setPrOptionsOpen] = useState(false);
  const [prBase, setPrBase] = useState<string>('');
  const [prTitleInput, setPrTitleInput] = useState<string>('');
  const [prBodyInput, setPrBodyInput] = useState<string>('');

  const runAutofixDryRun = async () => {
    if (!repoUrl) return alert('Please enter a repository URL first.');
    try {
      setAutofixLoading(true);
      setAutofixResults(null);
      const res = await fetch('/api/autofix', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repoUrl, dryRun: true }) });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Server error');
      }
      const data = await res.json();
      setAutofixResults(data.edits || []);
      setAutofixModalOpen(true);
    } catch (e: any) {
      console.error('Autofix failed', e);
      alert('Autofix failed: ' + (e.message || e));
    } finally {
      setAutofixLoading(false);
    }
  };

  const downloadEdits = () => {
    if (!autofixResults) return;
    const zip = autofixResults.map(e => `--- ${e.path} ---\n${e.updatedContent}\n\n`).join('\n');
    const blob = new Blob([zip], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'autofix-results.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#101628] via-[#181f36] to-[#232a45] text-white flex flex-col items-center justify-start p-0">
      {/* Header */}
      <header className="w-full py-10 flex flex-col items-center bg-[#101628] shadow-lg">
        <h1 className="text-6xl font-extrabold tracking-tight mb-2 text-blue-400 drop-shadow-lg">GuardianAI</h1>
        <p className="text-xl font-medium text-gray-200 mb-2">Your 24/7 Autonomous Security Engineer</p>
        <p className="text-md text-blue-200 mb-2">Powered by Google ADK + Vertex AI</p>
        <div className="flex gap-6 text-lg mt-2">
          <span className="flex items-center gap-1">🛡️ <span>24/7 Protection</span></span>
          <span className="flex items-center gap-1">🔍 <span>100+ Vulnerability Patterns</span></span>
          <span className="flex items-center gap-1">🤖 <span>Self-Learning AI</span></span>
        </div>
        <div className="mt-4">
          <button onClick={() => setAutoscanOpen(true)} className="px-3 py-1 bg-blue-600 rounded-md text-sm">Manage Autoscan</button>
        </div>
      </header>

      {/* Main Card */}
      <main className="w-full flex flex-col items-center mt-12">
        <div className="bg-[#181f36] rounded-2xl shadow-2xl p-10 max-w-2xl w-full border border-blue-900">
          <h2 className="text-3xl font-bold mb-4 text-blue-300 flex items-center gap-2">
            <span>🔗</span> Connect Repository
          </h2>
          <p className="mb-4 text-gray-300">Enter a public GitHub URL for AI-powered analysis</p>
          <div className="flex gap-2 mb-6">
            <input
              className="px-4 py-3 rounded-lg bg-[#232a45] text-white w-full border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              type="text"
              placeholder="https://github.com/username/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            <button
              className={`bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-bold text-lg transition-all duration-150 ${!repoUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!repoUrl}
            >
              Analyze
            </button>
            <button
              onClick={runAutofixDryRun}
              className={`bg-emerald-600 hover:bg-emerald-700 px-4 py-3 rounded-lg text-white font-semibold text-md transition-all duration-150 ${!repoUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!repoUrl || autofixLoading}
            >
              {autofixLoading ? 'Running...' : 'Run Autofix (Dry-run)'}
            </button>
            <button
              onClick={() => {
                if (!repoUrl) return alert('Please enter a repository URL first.');
                // Prefill modal fields from repoUrl
                const repoPath = repoUrl.replace('https://github.com/', '').split('/').slice(0,2).join('/');
                setPrBase('');
                setPrTitleInput(`GuardianAI: Automated Fixes ${new Date().toISOString().split('T')[0]}`);
                setPrBodyInput('Proposed fixes generated by GuardianAI autonomous patch generator.');
                setPrOptionsOpen(true);
              }}
              className={`bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg text-white font-semibold text-md transition-all duration-150 ${!repoUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!repoUrl || prLoading}
            >
              {prLoading ? 'Creating...' : 'Create PR (Demo)'}
            </button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <label className="font-semibold text-gray-200">Agent Mode:</label>
            <select
              className="bg-[#232a45] text-white px-3 py-2 rounded-lg border border-blue-700 text-md"
              value={agentMode}
              onChange={(e) => setAgentMode(e.target.value)}
            >
              <option value="manual">Manual Scan</option>
              <option value="auto">Autonomous</option>
            </select>
          </div>
          <div className="flex gap-6 text-md text-blue-200 mt-2">
            <span>⚡ ADK Agent</span>
            <span>• Vertex AI</span>
            <span>• 100+ Patterns</span>
          </div>
        </div>

        {/* Status Card */}
        <div className="mt-10 max-w-2xl w-full flex flex-col items-center">
          <div className="bg-[#232a45] rounded-xl p-6 w-full shadow-lg border border-blue-900 flex flex-col items-center">
            <h3 className="text-xl font-bold text-blue-300 mb-2 flex items-center gap-2">
              <span>🟢</span> Agent Status
            </h3>
            <p className="text-md text-gray-200 mb-2">GuardianAI is online and ready to analyze your repository.</p>
            <div className="flex gap-4 text-sm text-gray-400">
              <span>Last scan: <span className="text-green-400">Never</span></span>
              <span>Mode: <span className="text-blue-400">{agentMode === "auto" ? "Autonomous" : "Manual"}</span></span>
            </div>
          </div>
        </div>

        {/* Repository Info */}
        {repoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 mt-8"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-800 rounded-xl">
                  <Github className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Monitored Repository</h3>
                  <p className="text-blue-400 text-sm font-mono">{repoUrl.replace('https://github.com/', '')}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Last scanned: {currentTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {agentMode === 'auto' && (
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-1">Continuous Monitoring</p>
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 bg-green-400 rounded-full"
                    />
                    <span className="text-sm text-green-400 font-semibold">Every {nextScanIn} minutes</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-slate-900/50 to-blue-950/30 rounded-2xl p-6 border border-blue-700/30 mt-8"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Why GuardianAI is Different
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">Autonomous Remediation</p>
                <p className="text-slate-400 text-xs">Creates secure code patches and GitHub PRs automatically</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">Business Logic Detection</p>
                <p className="text-slate-400 text-xs">Catches flaws that $50K/year tools miss (price manipulation, etc.)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">Self-Learning Loop</p>
                <p className="text-slate-400 text-xs">Improves detection patterns from every scan and fix acceptance</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">Multi-Language Support</p>
                <p className="text-slate-400 text-xs">JS, TS, Python, Java, PHP, Go - 6 languages with 100+ patterns</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hackathon Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-2xl p-4 border border-yellow-700/30 text-center mt-8"
        >
          <p className="text-yellow-400 font-semibold text-sm">
            🏆 Built for GenAI Hackathon Mumbai 2025 - CyberSecurity Track
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Using Google's ADK + Vertex AI + Gemini 2.5 Flash
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 mt-16 flex flex-col items-center text-gray-500 text-sm">
        <span>© 2025 AI Security Force | GenAI Hackathon Mumbai</span>
        <span>GuardianAI v1.0</span>
      </footer>
      <Modal open={autofixModalOpen} onClose={() => setAutofixModalOpen(false)} title="Proposed Autofix Edits">
        {!autofixResults || autofixResults.length === 0 ? (
          <div className="text-slate-400">No edits proposed by the AI.</div>
        ) : (
          <div className="space-y-4">
            {autofixResults.map((e, i) => (
              <div key={i} className="border border-slate-700 rounded-lg p-3 bg-[#071021]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-300 font-semibold">{e.path}</div>
                  <div className="text-xs text-slate-400">{e.summary}</div>
                </div>
                <pre className="text-xs text-slate-200 bg-[#03121a] p-3 rounded-md overflow-auto whitespace-pre-wrap">{e.updatedContent.substring(0, 800)}</pre>
              </div>
            ))}
            <div className="flex items-center gap-3 justify-end">
              <button onClick={downloadEdits} className="px-3 py-2 bg-slate-700 rounded text-sm">Download Edits</button>
              <button
                onClick={async () => {
                  // Trigger server-side PR creation (server required)
                  try {
                    const res = await fetch('/api/autofix', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repoUrl, edits: autofixResults }) });
                    if (!res.ok) throw new Error(await res.text());
                    const data = await res.json();
                    alert('PR created: ' + (data.html_url || JSON.stringify(data)));
                  } catch (err: any) {
                    alert('Server PR creation failed. See console. ' + (err.message || err));
                    console.error(err);
                  }
                }}
                className="px-3 py-2 bg-emerald-600 rounded text-sm text-white"
              >
                Create PR (requires server)
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={prOptionsOpen} onClose={() => setPrOptionsOpen(false)} title="Create Pull Request">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-300">Repository</label>
            <input disabled value={repoUrl} className="w-full mt-1 p-2 rounded bg-[#071021] text-sm text-slate-200" />
          </div>
          <div>
            <label className="text-sm text-slate-300">Base branch (optional)</label>
            <input value={prBase} onChange={(e) => setPrBase(e.target.value)} placeholder="main" className="w-full mt-1 p-2 rounded bg-[#071021] text-sm text-slate-200" />
          </div>
          <div>
            <label className="text-sm text-slate-300">PR Title</label>
            <input value={prTitleInput} onChange={(e) => setPrTitleInput(e.target.value)} className="w-full mt-1 p-2 rounded bg-[#071021] text-sm text-slate-200" />
          </div>
          <div>
            <label className="text-sm text-slate-300">PR Body</label>
            <textarea value={prBodyInput} onChange={(e) => setPrBodyInput(e.target.value)} rows={4} className="w-full mt-1 p-2 rounded bg-[#071021] text-sm text-slate-200" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setPrOptionsOpen(false)} className="px-3 py-2 bg-slate-700 rounded text-sm">Cancel</button>
            <button
              onClick={async () => {
                try {
                  setPrLoading(true);
                  setPrUrl(null);
                  const body: any = { repoUrl, dryRun: false };
                  if (prTitleInput) body.prTitle = prTitleInput;
                  if (prBodyInput) body.prBody = prBodyInput;
                  if (prBase) body.prBase = prBase;
                  const res = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                  const text = await res.text();
                  if (!res.ok) {
                    throw new Error(text || 'Server error');
                  }
                  let data: any = {};
                  try { data = JSON.parse(text); } catch { data = text; }
                  const pr = data.pr || data;
                  const url = pr?.html_url || pr?.url || null;
                  if (url) {
                    setPrUrl(url);
                    setPrModalOpen(true);
                    setPrOptionsOpen(false);
                  } else {
                    alert('Scan completed but no PR url returned. See console.');
                    console.log('Scan response:', data);
                  }
                } catch (e: any) {
                  console.error('Create PR failed', e);
                  alert('Create PR failed: ' + (e.message || e));
                } finally {
                  setPrLoading(false);
                }
              }}
              className="px-3 py-2 bg-emerald-600 rounded text-sm text-white"
            >
              {prLoading ? 'Creating...' : 'Confirm Create PR'}
            </button>
          </div>
        </div>
      </Modal>
      {/* Floating Create PR button - persistent and clearly visible */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            if (!repoUrl) return alert('Please enter a repository URL first.');
            setPrTitleInput(`GuardianAI: Automated Fixes ${new Date().toISOString().split('T')[0]}`);
            setPrBodyInput('Proposed fixes generated by GuardianAI autonomous patch generator.');
            setPrOptionsOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-full shadow-xl flex items-center gap-3"
        >
          <Rocket className="w-4 h-4" />
          <span className="font-semibold">Create PR</span>
        </button>
      </div>
      <Modal open={prModalOpen} onClose={() => setPrModalOpen(false)} title="Pull Request Created">
        {prUrl ? (
          <div className="space-y-4">
            <p className="text-slate-300">A demo pull request was created successfully.</p>
            <a href={prUrl} target="_blank" rel="noreferrer" className="text-blue-400 underline break-words">{prUrl}</a>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(prUrl || ''); alert('PR URL copied to clipboard'); }}
                className="px-3 py-2 bg-slate-700 rounded text-sm"
              >
                Copy Link
              </button>
              <button onClick={() => setPrModalOpen(false)} className="px-3 py-2 bg-blue-600 rounded text-sm text-white">Close</button>
            </div>
          </div>
        ) : (
          <div className="text-slate-400">No PR URL available.</div>
        )}
      </Modal>
      <AutoscanManager open={autoscanOpen} onClose={() => setAutoscanOpen(false)} />
    </div>
  );
};

export default AgentDashboard;

