import React from 'react';

export default function GeminiCliHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full p-6 text-slate-100">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold">Gemini CLI (gcloud) Quick Start</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">Close</button>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-300">
          <p>Use the Google Cloud CLI to run Gemini model calls from your authenticated gcloud project. This is optional — the app uses the Node SDK/API by default.</p>

          <div className="bg-slate-800 p-3 rounded">
            <div className="font-medium">Install & authenticate</div>
            <pre className="mt-2 bg-slate-900 p-3 rounded text-xs overflow-auto">{`# Install Cloud SDK
https://cloud.google.com/sdk/docs/install

# Authenticate (login + application default)
gcloud auth login
gcloud auth application-default login`}</pre>
          </div>

          <div className="bg-slate-800 p-3 rounded">
            <div className="font-medium">Set project & location</div>
            <pre className="mt-2 bg-slate-900 p-3 rounded text-xs overflow-auto">{`gcloud config set project YOUR_PROJECT_ID
# optional
export GCLOUD_PROJECT=YOUR_PROJECT_ID
# set location (e.g. us-central1)
export VITE_VERTEX_LOCATION=us-central1`}</pre>
          </div>

          <div className="bg-slate-800 p-3 rounded">
            <div className="font-medium">Enable CLI mode in project (dev)</div>
            <pre className="mt-2 bg-slate-900 p-3 rounded text-xs overflow-auto">{`# in .env.local or shell
USE_GEMINI_CLI=true
# or VITE_USE_GEMINI_CLI=true (dev)
`}</pre>
          </div>

          <div className="bg-slate-800 p-3 rounded">
            <div className="font-medium">Test CLI locally</div>
            <pre className="mt-2 bg-slate-900 p-3 rounded text-xs overflow-auto">{`npm run test:gemini-cli -- https://github.com/githubtraining/hellogitworld`}</pre>
          </div>

          <p className="text-slate-400 text-xs">If gcloud is not installed or the CLI fails, the server will automatically fall back to the Node SDK/API path.</p>
        </div>
      </div>
    </div>
  );
}
