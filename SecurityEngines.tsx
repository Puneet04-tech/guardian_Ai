import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { AnalysisResult } from '../types';

interface EngineViewProps {
  data: AnalysisResult;
}

export const ThreatHunterView: React.FC<EngineViewProps> = ({ data }) => {
  const threats = data.threats || [];
  const securityPosture = data.securityPosture;

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Security Posture Dashboard */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <motion.div 
          className={`border backdrop-blur-xl p-6 rounded-2xl relative overflow-hidden group ${
            (securityPosture?.overallScore || 0) >= 80 ? 'bg-green-900/30 border-green-900' :
            (securityPosture?.overallScore || 0) >= 60 ? 'bg-yellow-900/30 border-yellow-900' : 'bg-red-900/30 border-red-900'
          }`}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="text-white text-sm font-semibold uppercase">Security Score</div>
            <div className="text-3xl font-bold text-white mt-1">{securityPosture?.overallScore || 0}%</div>
            <div className="text-xs text-slate-400 mt-1">Overall posture</div>
          </div>
        </motion.div>

        <motion.div 
          className={`border backdrop-blur-xl p-6 rounded-2xl relative overflow-hidden group ${
            securityPosture?.threatLevel === 'CRITICAL' ? 'bg-red-900/30 border-red-900' :
            securityPosture?.threatLevel === 'HIGH' ? 'bg-orange-900/30 border-orange-900' :
            securityPosture?.threatLevel === 'MEDIUM' ? 'bg-yellow-900/30 border-yellow-900' : 'bg-green-900/30 border-green-900'
          }`}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="text-white text-sm font-semibold uppercase">Threat Level</div>
            <div className="text-3xl font-bold text-white mt-1">{securityPosture?.threatLevel || 'LOW'}</div>
            <div className="text-xs text-slate-400 mt-1">Current status</div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-purple-900/30 border border-purple-900 backdrop-blur-xl p-6 rounded-2xl relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="text-purple-400 text-sm font-semibold uppercase">OWASP Threats</div>
            <div className="text-3xl font-bold text-white mt-1">{threats.length}</div>
            <div className="text-xs text-slate-400 mt-1">Categories identified</div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-red-900/30 border border-red-900 backdrop-blur-xl p-6 rounded-2xl relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 animate-pulse-glow">
            <div className="text-red-400 text-sm font-semibold uppercase">Critical Vulns</div>
            <div className="text-3xl font-bold text-white mt-1">{securityPosture?.criticalVulnerabilities || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Immediate action</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Security Metrics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-850 p-4 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">🔐 Encryption</div>
          <div className="text-2xl font-bold text-white">{securityPosture?.encryptionScore || 0}%</div>
          <div className="text-xs text-slate-400 mt-1">Data protection</div>
        </div>
        <div className="bg-slate-850 p-4 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">🔑 Authentication</div>
          <div className="text-2xl font-bold text-white">{securityPosture?.authenticationScore || 0}%</div>
          <div className="text-xs text-slate-400 mt-1">Identity security</div>
        </div>
        <div className="bg-slate-850 p-4 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">🛡️ Data Protection</div>
          <div className="text-2xl font-bold text-white">{securityPosture?.dataProtectionScore || 0}%</div>
          <div className="text-xs text-slate-400 mt-1">Privacy compliance</div>
        </div>
      </div>

      {/* OWASP Top 10 Threats */}
      <div className="bg-slate-850 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="text-red-500" />
          OWASP Top 10 Threat Analysis
        </h2>
        <div className="space-y-4">
          {threats.map((threat) => (
            <div key={threat.id} className="bg-slate-900 p-5 rounded-lg border border-slate-700 hover:border-red-500/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded ${
                      threat.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                      threat.severity === 'HIGH' ? 'bg-orange-600 text-white' : 'bg-yellow-600 text-white'
                    }`}>
                      {threat.severity}
                    </span>
                    <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">
                      {threat.owaspId}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{threat.title}</h3>
                  <p className="text-sm text-slate-400 mb-3">{threat.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-slate-500">Exploitability:</span>
                      <div className="flex gap-1 mt-1">
                        {Array.from({length: 10}).map((_, i) => (
                          <div key={i} className={`h-2 w-4 rounded ${i < threat.exploitability ? 'bg-red-500' : 'bg-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Impact:</span>
                      <div className="flex gap-1 mt-1">
                        {Array.from({length: 10}).map((_, i) => (
                          <div key={i} className={`h-2 w-4 rounded ${i < threat.impact ? 'bg-orange-500' : 'bg-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                    <div className="text-xs text-blue-400 font-semibold mb-1">🛡️ Mitigation Strategy:</div>
                    <p className="text-sm text-slate-300">{threat.mitigation}</p>
                  </div>

                  {threat.affectedFiles && threat.affectedFiles.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-slate-500 mb-1">Affected Files:</div>
                      <div className="flex flex-wrap gap-2">
                        {threat.affectedFiles.slice(0, 3).map((file, idx) => (
                          <span key={idx} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono">
                            {file}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {threats.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No OWASP threats detected. Excellent security posture!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const SecureVaultView: React.FC<EngineViewProps> = ({ data }) => {
  const secrets = data.secrets || [];
  const criticalSecrets = secrets.filter(s => s.severity === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      {/* Secrets Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-950/50 border border-red-900 p-4 rounded-lg">
          <div className="text-red-400 text-sm font-semibold uppercase">Secrets Exposed</div>
          <div className="text-3xl font-bold text-white mt-1">{secrets.length}</div>
          <div className="text-xs text-slate-400 mt-1">Total leaks</div>
        </div>
        <div className="bg-orange-950/50 border border-orange-900 p-4 rounded-lg">
          <div className="text-orange-400 text-sm font-semibold uppercase">Critical Leaks</div>
          <div className="text-3xl font-bold text-white mt-1">{criticalSecrets}</div>
          <div className="text-xs text-slate-400 mt-1">Immediate removal</div>
        </div>
        <div className="bg-purple-950/50 border border-purple-900 p-4 rounded-lg">
          <div className="text-purple-400 text-sm font-semibold uppercase">API Keys</div>
          <div className="text-3xl font-bold text-white mt-1">
            {secrets.filter(s => s.type === 'API_KEY').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Hardcoded keys</div>
        </div>
        <div className="bg-yellow-950/50 border border-yellow-900 p-4 rounded-lg">
          <div className="text-yellow-400 text-sm font-semibold uppercase">Passwords</div>
          <div className="text-3xl font-bold text-white mt-1">
            {secrets.filter(s => s.type === 'PASSWORD').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Plaintext passwords</div>
        </div>
      </div>

      {/* Secret Leaks Detection */}
      <div className="bg-slate-850 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="text-red-500" />
          Detected Secret Leaks & Credentials
        </h2>
        {secrets.length > 0 ? (
          <div className="space-y-4">
            {secrets.map((secret) => (
              <div key={secret.id} className="bg-slate-900 p-5 rounded-lg border border-red-900/50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 text-xs font-bold rounded bg-red-600 text-white">
                        {secret.severity}
                      </span>
                      <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-1 rounded">
                        {secret.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 font-mono mb-2">{secret.file}:{secret.line}</p>
                    <div className="bg-red-950/30 p-3 rounded border border-red-900 mb-3">
                      <div className="text-xs text-red-400 font-semibold mb-1">⚠️ Exposed Value:</div>
                      <code className="text-sm text-red-300 font-mono">{secret.value}</code>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                      <div className="text-xs text-green-400 font-semibold mb-1">🔒 Secure Storage Recommendation:</div>
                      <p className="text-sm text-slate-300">{secret.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No secrets detected in codebase! Excellent security hygiene.</p>
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="bg-blue-950/20 border border-blue-900 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-blue-400 mb-3">🔐 Secret Management Best Practices</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Use environment variables (.env files with .gitignore)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Implement secret management services (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Rotate credentials regularly (every 90 days minimum)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Use OAuth 2.0 / OpenID Connect instead of API keys where possible</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-1">✓</span>
            <span>Implement git-secrets or TruffleHog in CI/CD pipeline</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export const PenTestView: React.FC<EngineViewProps> = ({ data }) => {
  const findings = data.pentestFindings || [];
  const compliance = data.compliance || [];

  return (
    <div className="space-y-6">
      {/* Pentest Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-950/50 border border-red-900 p-4 rounded-lg">
          <div className="text-red-400 text-sm font-semibold uppercase">Total Findings</div>
          <div className="text-3xl font-bold text-white mt-1">{findings.length}</div>
          <div className="text-xs text-slate-400 mt-1">Vulnerabilities</div>
        </div>
        <div className="bg-orange-950/50 border border-orange-900 p-4 rounded-lg">
          <div className="text-orange-400 text-sm font-semibold uppercase">Critical</div>
          <div className="text-3xl font-bold text-white mt-1">
            {findings.filter(f => f.severity === 'CRITICAL').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">High priority</div>
        </div>
        <div className="bg-yellow-950/50 border border-yellow-900 p-4 rounded-lg">
          <div className="text-yellow-400 text-sm font-semibold uppercase">Vulnerable</div>
          <div className="text-3xl font-bold text-white mt-1">
            {findings.filter(f => f.vulnerable).length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Confirmed exploitable</div>
        </div>
        <div className="bg-blue-950/50 border border-blue-900 p-4 rounded-lg">
          <div className="text-blue-400 text-sm font-semibold uppercase">Compliance</div>
          <div className="text-3xl font-bold text-white mt-1">{compliance.length}</div>
          <div className="text-xs text-slate-400 mt-1">Standards checked</div>
        </div>
      </div>

      {/* Penetration Test Findings */}
      <div className="bg-slate-850 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="text-orange-500" />
          Penetration Testing Findings
        </h2>
        <div className="space-y-4">
          {findings.map((finding) => (
            <div key={finding.id} className="bg-slate-900 p-5 rounded-lg border border-slate-700">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded ${
                      finding.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                      finding.severity === 'HIGH' ? 'bg-orange-600 text-white' :
                      finding.severity === 'MEDIUM' ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {finding.severity}
                    </span>
                    <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">
                      {finding.testType.replace('_', ' ')}
                    </span>
                    {finding.vulnerable && (
                      <span className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded">
                        ⚠️ EXPLOITABLE
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-slate-500">Endpoint:</span>
                      <p className="text-white font-mono">{finding.endpoint}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Method:</span>
                      <p className="text-white font-mono">{finding.method}</p>
                    </div>
                  </div>

                  {finding.payload && (
                    <div className="bg-slate-800/50 p-3 rounded border border-slate-700 mb-3">
                      <div className="text-xs text-orange-400 font-semibold mb-1">🔥 Exploit Payload:</div>
                      <code className="text-sm text-orange-300 font-mono">{finding.payload}</code>
                    </div>
                  )}

                  <div className="bg-slate-800/50 p-3 rounded border border-slate-700 mb-3">
                    <div className="text-xs text-yellow-400 font-semibold mb-1">📋 Proof of Concept:</div>
                    <p className="text-sm text-slate-300">{finding.proof}</p>
                  </div>

                  <div className="bg-green-950/20 p-3 rounded border border-green-900">
                    <div className="text-xs text-green-400 font-semibold mb-1">✅ Remediation:</div>
                    <p className="text-sm text-slate-300">{finding.remediation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {findings.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No vulnerabilities found in penetration testing!</p>
            </div>
          )}
        </div>
      </div>

      {/* Compliance Status */}
      <div className="bg-slate-850 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="text-blue-500" />
          Security Compliance Status
        </h2>
        <div className="space-y-3">
          {compliance.map((item, idx) => (
            <div key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex items-start gap-4">
              <div className={`px-3 py-1 text-xs font-bold rounded ${
                item.status === 'PASS' ? 'bg-green-600 text-white' :
                item.status === 'WARNING' ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white'
              }`}>
                {item.status}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">{item.standard}</span>
                  <h3 className="text-white font-semibold">{item.requirement}</h3>
                </div>
                <p className="text-sm text-slate-400 mb-2">{item.description}</p>
                <div className="text-xs text-slate-500">
                  <strong>Remediation:</strong> {item.remediation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
