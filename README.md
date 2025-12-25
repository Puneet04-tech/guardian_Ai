<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🛡️ GuardianAI - Your 24/7 Autonomous Security Engineer

**AI-Powered Code Protection That Never Sleeps - Built with Google's ADK, Vertex AI & Gemini 2.5 Flash**

GuardianAI is an autonomous AI agent that acts as your personal security guardian. Using Google's Agent Development Kit (ADK) and Vertex AI, it continuously monitors your repositories, detects 100+ vulnerability patterns across OWASP Top 10, and autonomously creates Pull Requests with security fixes. Built for the GenAI Hackathon Mumbai 2025.

Security & signing notes:
- **SIGNING_KEY**: optional HMAC key used to sign persisted patches for auditable certificates (set `SIGNING_KEY` in `.env.local` or let server use an ephemeral key for demos).
- **ADMIN_KEY**: set `ADMIN_KEY` (or `VITE_ADMIN_KEY`) to protect admin-only endpoints (patch signing, CI check-run). Admin endpoints read header `x-admin-key` or query `?adminKey=` for convenience in demos; in production use a secure secret store.

Use these keys for secure signing and CI integrations while keeping keys off the client and logs.

### Latest updates (2025-12-24) 🚀
- **Create PR UI** with Dry-Run preview and Confirm Create PR flow (preview `prEdits` before creating PRs).
- **Demo fallback** when Gemini quota is exhausted (set `DEMO_FALLBACK=true` or use the UI 'Use Demo Edits').
- **Gemini CLI support** (optional) via `USE_GEMINI_CLI=true` for `gcloud`-based model calls.
- **Patch persistence & exports**: patches are persisted on the server and are downloadable as JSON or ZIP:
  - `GET /api/patches` — list saved patches
  - `GET /api/patches/:id` — view a single patch
  - `GET /api/patches/:id/download` — download a single patch JSON
  - `GET /api/patches/download-all` — JSON with all patches
  - `GET /api/patches/download-zip` — zip archive of patches (optional `?ids=comma,separated`).

New analysis & integration endpoints:
- `POST /api/sca` — Software Composition Analysis: checks `package.json` against npm latest versions and reports outdated deps & licenses.
- `POST /api/ci/check-run` — Create a GitHub Check Run for CI reporting (requires `GITHUB_TOKEN`).
- `GET /api/patches/:id/certificate.pdf` — Download a signed PDF certificate for a signed patch (requires patch to be signed via `/api/patches/:id/sign`).
- `POST /api/patches/:id/generate-tests` — Request an auto-generated test skeleton for the patched files (Jest test suggestions).

- **Presentation & proof**: judge-ready slides and a combined PDF are at `presentation/GuardianAI-presentation.pdf`.
- **Server-side AI keys**: move `GEMINI_API_KEY` and `GITHUB_TOKEN` into `.env.local` (server performs all model calls and PR creation).

## 🏆 Hackathon Project - CyberSecurity Track
**ML Mumbai GenAI Hackathon | December 2025**
- ✅ Uses Google's ADK for autonomous agent orchestration
- ✅ Deploys on Vertex AI for enterprise-scale security
- ✅ Integrates Gemini 2.5 Flash via API (optional gcloud CLI support available)
- ✅ Solves $200B annual security spending problem with AI automation

View your app in AI Studio: https://ai.studio/apps/drive/1juDPrvEiHyYxMiHI6kBWI1VhbFwZ7NhL

## 🎯 Agent by Agent: How GuardianAI Works

**Autonomous Security Engineering in 4 Steps:**

```
📊 Step 1: Continuous Monitoring
   └─> ADK schedules scans via Cloud Scheduler (every 60 min)
   └─> Monitors GitHub webhooks for new commits

🔍 Step 2: Deep Analysis  
   └─> Vertex AI + Gemini 2.5 Flash analyzes code
   └─> 100+ local intelligence patterns (OWASP Top 10)
   └─> Multi-language support (JS, TS, Python, Java, PHP, Go)

🛠️ Step 3: Autonomous Fix Generation
   └─> Agent generates secure code patches
   └─> Validates fixes against best practices
   └─> 85%+ confidence threshold for auto-fix

✅ Step 4: Auto-PR & Learning
   └─> Creates GitHub PR with security fixes
   └─> Learns from each scan (improves patterns)
   └─> Alerts team via Slack/Email integration
```

## 🚀 Quick Start

**Prerequisites:** Node.js 18+, GCP Account (free tier OK)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Agent (copy `.env.example` to `.env.local`):**
   ```env
   VITE_VERTEX_PROJECT_ID=your_gcp_project_id
   VITE_VERTEX_LOCATION=us-central1
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_GITHUB_TOKEN=your_github_token_with_repo_scope
   VITE_AGENT_AUTO_PR=true
   ```

3. **Deploy Agent to Vertex AI:**
   ```bash
   gcloud ai deploy --region=us-central1
   ```

4. **Or run locally for testing:**
   ```bash
   npm run dev
   # Open http://localhost:5173
   ```

## 🔒 Security Engines (NEW!)

**Advanced Cybersecurity Analysis - OWASP Top 10 2021 Integration**

### 🎯 ThreatHunter - OWASP Top 10 Security Scanner
- **OWASP Top 10 2021 Threat Detection**:
  - A01: Broken Access Control
  - A02: Cryptographic Failures
  - A03: Injection (SQL, NoSQL, Command, LDAP)
  - A05: Security Misconfiguration
  - A07: Identification & Authentication Failures
- **Security Posture Dashboard** with 7-dimensional scoring:
  - Overall Security Score (0-100%)
  - Threat Level (CRITICAL/HIGH/MEDIUM/LOW)
  - Encryption Score
  - Authentication Score
  - Data Protection Score
  - Input Validation Score
  - Code Quality Score
- **Exploitability & Impact Analysis** with visual bars
- **CWE & CVE Mapping** for vulnerability tracking
- **Mitigation Strategies** with actionable remediation steps

### 🔐 SecureVault - Secrets & Credentials Detection
- **8 Secret Pattern Detection**:
  - API Keys (Google, AWS, Azure, Generic)
  - Passwords (plaintext in code)
  - Tokens (Bearer, OAuth, JWT)
  - Private Keys (RSA, SSH)
  - Database Connection Strings
  - AWS Access Keys
  - Stripe Secret Keys
  - JWT Secrets
- **Severity Classification** (CRITICAL/HIGH/MEDIUM)
- **Secure Storage Recommendations**
- **Best Practices Panel** with industry-standard secret management
- **Masked Value Display** for security

### 🛡️ PenTest - Penetration Testing Engine
- **Automated Vulnerability Testing**:
  - SQL Injection Detection
  - Cross-Site Scripting (XSS)
  - Cross-Site Request Forgery (CSRF)
  - Command Injection
  - Path Traversal
  - Insecure Deserialization
  - Server-Side Request Forgery (SSRF)
  - XML External Entity (XXE)
- **Exploit Payload Generation** with proof-of-concept
- **Vulnerability Confirmation** (exploitable vs. theoretical)
- **Compliance Checking**:
  - OWASP ASVS
  - GDPR Security Requirements
  - PCI-DSS
  - HIPAA
  - SOC 2
  - ISO 27001
- **Remediation Guidance** for each finding

## 📊 Analysis Engines

**Comprehensive Code Quality & Performance Analysis**

### 🧬 DevDNA - Developer Intelligence
- 👥 Developer contribution tracking with expertise mapping
- 🔥 Code hot spot detection (frequently changed files)
- 📊 Code complexity metrics (average, maintainability index)
- 📈 Commit velocity and impact analysis

### 🐛 BugPredictor - AI Security Analysis
- 🛡️ Security score dashboard (0-100 scale)
- 🎯 Confidence scores for each bug prediction (70-95%)
- 💡 AI-generated fix suggestions
- 🔍 Pattern analysis (XSS, SQL injection, eval, innerHTML)
- ⚠️ Critical security issues panel

### 🏗️ ArchGuard - Architecture & Technical Debt
- 📉 Technical debt scoring with hours-to-fix estimates
- 🎨 Architecture violation detection (5+ patterns)
- 🔄 Circular dependency detection
- 📊 Maintainability index tracking
- 🏢 Layer violation alerts (UI → DB direct access)

### 💰 CloudCost - Cost Intelligence
- 💵 Cost breakdown by category (Compute, Storage, Database, Network)
- 📊 Cost trend analysis (increasing/stable/decreasing)
- 💡 3 optimization tips per service
- 📈 Annual savings projections
- 🎯 Service-specific recommendations

### 🔗 DataLineage - Performance & Dependencies
- ⚡ Performance bottleneck detection
- 🔗 Interactive dependency graph with D3.js
- 📊 Module coupling score (0-10 scale)
- 🎯 Optimization opportunity counting
- 🖱️ Drag-and-drop node exploration

### 💬 AI Security Consultant (Gemini 2.5 Flash)
- 🤖 Multi-modal code + documentation analysis
- 💡 Real-time security recommendations
- 🔍 OWASP Top 10 compliance checking
- 🛡️ Best practices for secure coding
- 🔐 Threat modeling and risk assessment
- 🔄 Fallback to local intelligence (100+ patterns) on rate limits

## 🛠️ Technology Stack

### **Agent Infrastructure (Hackathon Tech Stack)**
- **ADK (Agent Development Kit)**: Autonomous agent orchestration & decision-making
- **Vertex AI**: Enterprise deployment of Gemini models at scale
- **Gemini 2.5 Flash**: Multi-modal AI for code analysis (API by default; optional `gcloud` CLI supported)
- **Google Cloud Functions**: Automated scanning triggers on commits
- **Cloud Scheduler**: Continuous monitoring (24/7 autonomous operation)

### **Frontend & Intelligence**
- **Frontend**: React 19.2.3 + TypeScript 5.8.2
- **Local Intelligence**: 100+ vulnerability patterns (regex-based)
- **UI Framework**: Tailwind CSS 3.4.17
- **Visualization**: Recharts + D3.js force-directed graphs
- **Build Tool**: Vite 6.0.5

### **Security Standards**
- **OWASP Top 10 2021**: 100% coverage with 60+ patterns
- **Advanced Threats**: XXE, SSTI, Prototype Pollution, ReDoS, NoSQL Injection
- **Compliance**: GDPR, PCI-DSS, HIPAA, SOC 2, ISO 27001
- **Multi-Language**: JavaScript, TypeScript, Python, Java, PHP, Go

## 🚀 High Availability Features

### Dual AI API Support
CodeIntel AI now supports **automatic failover** between Gemini and Grok APIs:

1. **Primary**: Gemini 2.5 Flash (fast, cost-effective)
2. **Fallback**: Grok Beta (when Gemini hits rate limits)
3. **Zero Downtime**: Seamless switching between APIs
4. **Rate Limit Protection**: Never fails due to API quotas

**How it works:**
- System tries Gemini first
- If rate limited (HTTP 429) → Automatically switches to Grok
- If both fail → Shows clear error message
- No user intervention needed! 🎯

## How to Get Gemini API Key

1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account

## Troubleshooting: Why you might see "Quota exceeded"

If you receive a Gemini quota error even on your first attempt for the day, common causes include:

- A sample or shared API key is present in `.env.local` (check `GEMINI_API_KEY` / `VITE_GEMINI_API_KEY`). Replace it with your own key tied to your GCP project.
- Autoscan is enabled and ran at startup (check `server/autoscan.json` or `VITE_AGENT_CONTINUOUS_SCAN` / `VITE_AGENT_SCAN_INTERVAL`). Autoscan can consume requests automatically.
- Other services or team members may be using the same GCP project / API key and consuming the free-tier quota.

What to do:

1. Verify which key the server is using by checking `.env.local` in the project root.
2. Visit the Google AI usage dashboard to inspect quota and rate limits: https://ai.dev/usage?tab=rate-limit
3. If you want to keep demoability while under quota, enable the demo fallback (default behavior) or set `DEMO_FALLBACK=true` in `.env.local` to fall back to simulated edits automatically.
4. To avoid unexpected autoscan usage during testing, set `VITE_AGENT_CONTINUOUS_SCAN=false` or clear `server/autoscan.json`.
5. Consider enabling billing or requesting higher quota for production use.

See the Gemini rate-limits documentation for more details: https://ai.google.dev/gemini-api/docs/rate-limits

## Using the Google Cloud CLI (recommended for best results)

You can configure the project to use the Google Cloud CLI (`gcloud`) for Gemini model calls instead of the Node SDK — this can produce slightly different results and aligns with the Google Cloud toolchain.

Steps:

1. Install the Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Authenticate: run `gcloud auth login` and (for application default credentials) `gcloud auth application-default login`.
3. Enable the Generative AI API on your project and set your project and location (if not already set):

```bash
gcloud config set project YOUR_PROJECT_ID
export GCLOUD_PROJECT=YOUR_PROJECT_ID
export VITE_VERTEX_PROJECT_ID=YOUR_PROJECT_ID
export VITE_VERTEX_LOCATION=us-central1
```

4. (Optional) Enable CLI usage in the project by setting the env var `USE_GEMINI_CLI=true` (or `VITE_USE_GEMINI_CLI=true` in `.env.local`). The server loads `.env.local` in dev. If not set, the project will use the Node SDK and API calls by default.

Gemini CLI Quick Start (gcloud):

```bash
# Install Cloud SDK: https://cloud.google.com/sdk/docs/install
gcloud auth login
# optional: application default credentials
gcloud auth application-default login
# set your project
gcloud config set project YOUR_PROJECT_ID
# Then enable CLI usage in .env.local
USE_GEMINI_CLI=true
# Run a quick test
npm run test:gemini-cli -- https://github.com/githubtraining/hellogitworld
```

Notes & troubleshooting:
- If the CLI is not available or fails, the server will automatically fall back to the SDK-based path.
- The server attempts several common `gcloud` variants (`gcloud ai models predict`, `gcloud alpha ai models predict`, `gcloud ai generate-text`) and parses JSON output when available.
- To test locally, set `USE_GEMINI_CLI=true` and run a dry-run via the UI or `curl` to `/api/scan`.

If you'd like, I can add a convenience test script to run a quick CLI-based dry-run locally; tell me if you want that and I will add it.

Saving and sharing generated patches for judges

- The server persists every generated patch (dry-run, autoscan, demo, and PR-created) in `server/patches.json` for auditing.
- To list saved patches: call the API endpoint `GET /api/patches` (Vite proxies `/api` to server).
- To view a single patch: `GET /api/patches/:id`.
- To download a patch (JSON): `GET /api/patches/:id/download` — this returns a JSON file you can share with judges as proof.
- To download all recorded patches: `GET /api/patches/download-all` — returns a single JSON attachment with all patches.
- To download patches as a ZIP file: `GET /api/patches/download-zip` — returns a zip archive of all patches. Use `GET /api/patches/download-zip?ids=patch-...` to include specific patch ids (comma-separated).

Quick deploy scripts (safe defaults):
- `scripts/deploy-cloudrun.sh PROJECT_ID [GITHUB_TOKEN] [GEMINI_API_KEY]` — builds & deploys to Cloud Run with DEMO_FALLBACK enabled (conservative defaults)
- `scripts/deploy-cloudrun.ps1` — PowerShell alternative for Windows users

Judge handout (one-page): `docs/judge-handout.md`

From the UI, click the **View Patches** button in the header to open the patches modal and download per-patch JSON files for sharing with judges.

To run the CLI test script locally (uses ts-node loader):

```bash
npm run test:gemini-cli -- https://github.com/githubtraining/hellogitworld
```

Note: Set `USE_GEMINI_CLI=true` in your `.env.local` to force CLI usage. If `gcloud` is not installed or the CLI fails, the script will fall back to the Node SDK path.
3. Click "Create API Key"
4. Copy the key and add it to your `.env.local` file
