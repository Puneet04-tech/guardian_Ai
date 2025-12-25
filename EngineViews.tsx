import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle, GitCommit, ShieldAlert, DollarSign, Sparkles, FileCode, Code, Palette, Settings, FileText } from 'lucide-react';
import { LineageGraph } from './LineageGraph';
import { AnalysisResult, ArchitectureViolation } from '../types';
import { ThreatHunterView, SecureVaultView, PenTestView } from './SecurityEngines';

interface EngineViewProps {
  data: AnalysisResult;
}

export const DevDNAView: React.FC<EngineViewProps> = ({ data }) => {
  const hotSpots = data.hotSpots || [];
  const developers = data.developers || [];
  const complexity = data.complexity;

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Metrics Overview */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <motion.div 
          className="bg-purple-900/30 backdrop-blur-xl border border-purple-700/50 p-6 rounded-2xl relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <div className="relative z-10">
            <div className="text-purple-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="animate-pulse" /> Code Complexity
            </div>
            <div className="text-4xl font-bold bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent mt-2">{complexity?.average || 0}/10</div>
            <div className="text-xs text-slate-400 mt-2">{complexity?.high || 0} complex files</div>
          </div>
        </motion.div>
        <motion.div 
          className="bg-blue-900/30 backdrop-blur-xl border border-blue-700/50 p-6 rounded-2xl relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <div className="relative z-10">
            <div className="text-blue-400 text-sm font-semibold uppercase tracking-wider">Maintainability</div>
            <div className="text-4xl font-bold bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent mt-2">{complexity?.maintainabilityIndex || 0}%</div>
            <div className="text-xs text-slate-400 mt-2">Overall health</div>
          </div>
        </motion.div>
        <motion.div 
          className="bg-orange-900/30 backdrop-blur-xl border border-orange-700/50 p-6 rounded-2xl relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <div className="relative z-10">
            <div className="text-orange-400 text-sm font-semibold uppercase tracking-wider">Hot Spots</div>
            <div className="text-4xl font-bold bg-gradient-to-br from-orange-400 to-red-400 bg-clip-text text-transparent mt-2">{hotSpots.length}</div>
            <div className="text-xs text-slate-400 mt-2">Frequently changed</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Repository Files Section */}
      <motion.div 
        className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl p-6 rounded-2xl border border-purple-500/50 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 360, scale: 1.1 }} 
            transition={{ duration: 0.5 }}
            className="bg-purple-600/20 p-2 rounded-lg"
          >
            <FileCode className="text-purple-400" size={24} />
          </motion.div>
          Repository Files
          <span className="text-sm text-purple-400 font-normal ml-2">
            ({data.repositoryFiles?.length || 0} total files)
          </span>
        </h2>
        
        {data.categorizedFiles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Source Files */}
            {data.categorizedFiles.source.length > 0 && (
              <motion.div 
                className="bg-blue-900/20 backdrop-blur-sm p-4 rounded-xl border border-blue-700/30 hover:border-blue-500/50 transition-all"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Source Code ({data.categorizedFiles.source.length})
                </h3>
                <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                  {data.categorizedFiles.source.slice(0, 50).map((file, idx) => (
                    <motion.div 
                      key={idx} 
                      className="text-xs text-slate-300 font-mono bg-slate-800/50 px-3 py-1.5 rounded hover:bg-slate-700/70 transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      whileHover={{ x: 2 }}
                    >
                      {file}
                    </motion.div>
                  ))}
                  {data.categorizedFiles.source.length > 50 && (
                    <p className="text-xs text-slate-500 italic mt-2 px-3">
                      +{data.categorizedFiles.source.length - 50} more files...
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Style Files */}
            {data.categorizedFiles.styles.length > 0 && (
              <motion.div 
                className="bg-pink-900/20 backdrop-blur-sm p-4 rounded-xl border border-pink-700/30 hover:border-pink-500/50 transition-all"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-pink-400 font-semibold mb-3 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Styles ({data.categorizedFiles.styles.length})
                </h3>
                <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                  {data.categorizedFiles.styles.map((file, idx) => (
                    <motion.div 
                      key={idx} 
                      className="text-xs text-slate-300 font-mono bg-slate-800/50 px-3 py-1.5 rounded hover:bg-slate-700/70 transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      whileHover={{ x: 2 }}
                    >
                      {file}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Config Files */}
            {data.categorizedFiles.config.length > 0 && (
              <motion.div 
                className="bg-yellow-900/20 backdrop-blur-sm p-4 rounded-xl border border-yellow-700/30 hover:border-yellow-500/50 transition-all"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuration ({data.categorizedFiles.config.length})
                </h3>
                <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                  {data.categorizedFiles.config.map((file, idx) => (
                    <motion.div 
                      key={idx} 
                      className="text-xs text-slate-300 font-mono bg-slate-800/50 px-3 py-1.5 rounded hover:bg-slate-700/70 transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      whileHover={{ x: 2 }}
                    >
                      {file}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Documentation Files */}
            {data.categorizedFiles.documentation.length > 0 && (
              <motion.div 
                className="bg-green-900/20 backdrop-blur-sm p-4 rounded-xl border border-green-700/30 hover:border-green-500/50 transition-all"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentation ({data.categorizedFiles.documentation.length})
                </h3>
                <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                  {data.categorizedFiles.documentation.map((file, idx) => (
                    <motion.div 
                      key={idx} 
                      className="text-xs text-slate-300 font-mono bg-slate-800/50 px-3 py-1.5 rounded hover:bg-slate-700/70 transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      whileHover={{ x: 2 }}
                    >
                      {file}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Markup Files */}
            {data.categorizedFiles.markup.length > 0 && (
              <motion.div 
                className="bg-orange-900/20 backdrop-blur-sm p-4 rounded-xl border border-orange-700/30 hover:border-orange-500/50 transition-all"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  Markup ({data.categorizedFiles.markup.length})
                </h3>
                <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                  {data.categorizedFiles.markup.map((file, idx) => (
                    <motion.div 
                      key={idx} 
                      className="text-xs text-slate-300 font-mono bg-slate-800/50 px-3 py-1.5 rounded hover:bg-slate-700/70 transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      whileHover={{ x: 2 }}
                    >
                      {file}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Other Files */}
            {data.categorizedFiles.other.length > 0 && (
              <motion.div 
                className="bg-purple-900/20 backdrop-blur-sm p-4 rounded-xl border border-purple-700/30 hover:border-purple-500/50 transition-all"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  Other ({data.categorizedFiles.other.length})
                </h3>
                <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                  {data.categorizedFiles.other.slice(0, 30).map((file, idx) => (
                    <motion.div 
                      key={idx} 
                      className="text-xs text-slate-300 font-mono bg-slate-800/50 px-3 py-1.5 rounded hover:bg-slate-700/70 transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      whileHover={{ x: 2 }}
                    >
                      {file}
                    </motion.div>
                  ))}
                  {data.categorizedFiles.other.length > 30 && (
                    <p className="text-xs text-slate-500 italic mt-2 px-3">
                      +{data.categorizedFiles.other.length - 30} more files...
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <FileCode className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No repository files found</p>
            <p className="text-slate-500 text-sm mt-2">Files will appear here after analysis</p>
          </motion.div>
        )}
      </motion.div>

      {/* Developer Contributions */}
      {developers.length > 0 && (
        <motion.div 
          className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
              <GitCommit className="text-blue-400" />
            </motion.div>
            Developer Contributions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {developers.map((dev, idx) => (
              <motion.div 
                key={idx} 
                className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-xl border border-slate-600/50 hover:border-blue-500/50 transition-all"
                whileHover={{ scale: 1.02, y: -2 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <h3 className="text-lg font-semibold text-white mb-2">{dev.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-400">Commits:</div>
                  <div className="text-white font-semibold">{dev.commits}</div>
                  <div className="text-slate-400">Files Changed:</div>
                  <div className="text-white font-semibold">{dev.filesChanged}</div>
                  <div className="text-slate-400">Lines Added:</div>
                  <div className="text-green-400 font-semibold">+{dev.linesAdded}</div>
                  <div className="text-slate-400">Lines Removed:</div>
                  <div className="text-red-400 font-semibold">-{dev.linesDeleted}</div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-slate-500 mb-1">Expertise:</div>
                  <div className="flex gap-2 flex-wrap">
                    {dev.expertise.map((ext, i) => (
                      <motion.span 
                        key={i} 
                        className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full border border-blue-700/50"
                        whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.3)" }}
                      >
                        {ext}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Hot Spots */}
      {hotSpots.length > 0 && (
        <motion.div 
          className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle className="text-orange-400" />
            </motion.div>
            Code Hot Spots
          </h2>
          <div className="space-y-3">
            {hotSpots.map((spot, idx) => (
              <motion.div 
                key={idx} 
                className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-xl border border-slate-600/50 hover:border-orange-500/70 transition-all cursor-pointer group"
                whileHover={{ scale: 1.01, x: 4 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-md font-semibold text-white font-mono">{spot.file}</h4>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-slate-400">Changes: <span className="text-white font-semibold">{spot.changeFrequency}</span></span>
                      <span className="text-slate-400">Contributors: <span className="text-white font-semibold">{spot.contributors}</span></span>
                      <span className="text-slate-400">Last: <span className="text-white">{spot.lastChanged}</span></span>
                    </div>
                  </div>
                  <motion.span 
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-lg ${
                      spot.riskLevel === 'High' ? 'bg-red-600 text-white' :
                      spot.riskLevel === 'Medium' ? 'bg-orange-600 text-white' : 'bg-yellow-600 text-white'
                    }`}
                    animate={{ scale: spot.riskLevel === 'High' ? [1, 1.05, 1] : 1 }}
                    transition={{ duration: 2, repeat: spot.riskLevel === 'High' ? Infinity : 0 }}
                  >
                    {spot.riskLevel} Risk
                  </motion.span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Architectural Timeline */}
      <motion.div 
        className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
            <GitCommit className="text-blue-400" />
          </motion.div>
          Architectural Timeline
        </h2>
        <div className="relative border-l border-slate-600/50 ml-4 space-y-8">
          {(data.decisions || []).map((decision, idx) => (
            <motion.div 
              key={decision.id} 
              className="mb-8 ml-6 relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
              whileHover={{ x: 4 }}
            >
              <motion.span 
                className="absolute -left-[37px] flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full ring-4 ring-slate-900 shadow-lg"
                whileHover={{ scale: 1.2, rotate: 360 }}
                transition={{ duration: 0.3 }}
              >
                <GitCommit className="w-4 h-4 text-white" />
              </motion.span>
              <div className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-xl border border-slate-600/50 shadow-md hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-white">{decision.title}</h3>
                  <div className="flex gap-2">
                    {decision.impact && (
                      <motion.span 
                        className={`px-3 py-1 text-xs rounded-lg font-bold shadow-lg ${
                          decision.impact === 'High' ? 'bg-red-600/90 text-white' :
                          decision.impact === 'Medium' ? 'bg-yellow-600/90 text-white' : 'bg-green-600/90 text-white'
                        }`}
                        whileHover={{ scale: 1.1 }}
                      >
                        {decision.impact} Impact
                      </motion.span>
                    )}
                    <motion.span 
                      className={`px-3 py-1 text-xs rounded-full font-medium shadow-lg ${
                        decision.type === 'Security' ? 'bg-red-900/90 text-red-200' : 
                        decision.type === 'Performance' ? 'bg-green-900/90 text-green-200' : 'bg-blue-900/90 text-blue-200'
                      }`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {decision.type}
                    </motion.span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-2">
                  Author: <span className="text-blue-400">{decision.author}</span> • {decision.date}
                  {decision.filesAffected && ` • ${decision.filesAffected} files affected`}
                </p>
              </div>
            </motion.div>
          ))}
          {(!data.decisions || data.decisions.length === 0) && (
            <motion.p 
              className="text-slate-500 italic ml-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No architectural decisions found.
            </motion.p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const BugPredictorView: React.FC<EngineViewProps> = ({ data }) => {
  const bugs = data.bugs || [];
  const security = data.security;
  const criticalCount = bugs.filter(b => b.severity === 'CRITICAL').length;
  const highCount = bugs.filter(b => b.severity === 'HIGH').length;
  
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Security Score Dashboard */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <motion.div 
          className={`border backdrop-blur-xl p-6 rounded-2xl relative overflow-hidden group ${
            (security?.score || 0) >= 80 ? 'bg-green-900/30 border-green-700/50' :
            (security?.score || 0) >= 60 ? 'bg-yellow-900/30 border-yellow-700/50' : 'bg-red-900/30 border-red-700/50'
          }`}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
              (security?.score || 0) >= 80 ? 'bg-gradient-to-br from-green-600/10 to-emerald-600/10' :
              (security?.score || 0) >= 60 ? 'bg-gradient-to-br from-yellow-600/10 to-orange-600/10' : 'bg-gradient-to-br from-red-600/10 to-pink-600/10'
            }`}
          />
          <div className="relative z-10">
            <div className="text-white text-sm font-semibold uppercase tracking-wider">Security Score</div>
            <div className="text-4xl font-bold bg-gradient-to-br from-white to-slate-300 bg-clip-text text-transparent mt-2">{security?.score || 0}%</div>
            <div className="text-xs text-slate-400 mt-2">Overall security health</div>
          </div>
        </motion.div>
        <motion.div 
          className="bg-red-900/30 backdrop-blur-xl border border-red-700/50 p-6 rounded-2xl relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <div className="relative z-10">
            <div className="text-red-400 text-sm font-semibold uppercase tracking-wider">Critical Issues</div>
            <motion.div 
              className="text-4xl font-bold bg-gradient-to-br from-red-400 to-pink-400 bg-clip-text text-transparent mt-2"
              animate={{ scale: criticalCount > 0 ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 2, repeat: criticalCount > 0 ? Infinity : 0 }}
            >
              {criticalCount}
            </motion.div>
            <div className="text-xs text-slate-400 mt-2">Immediate attention</div>
          </div>
        </motion.div>
        <motion.div 
          className="bg-orange-900/30 backdrop-blur-xl border border-orange-700/50 p-6 rounded-2xl relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <div className="relative z-10">
            <div className="text-orange-400 text-sm font-semibold uppercase tracking-wider">High Priority</div>
            <div className="text-4xl font-bold bg-gradient-to-br from-orange-400 to-red-400 bg-clip-text text-transparent mt-2">{highCount}</div>
            <div className="text-xs text-slate-400 mt-2">Fix soon</div>
          </div>
        </motion.div>
        <motion.div 
          className="bg-purple-900/30 backdrop-blur-xl border border-purple-700/50 p-6 rounded-2xl relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <div className="relative z-10">
            <div className="text-purple-400 text-sm font-semibold uppercase tracking-wider">Total Vulnerabilities</div>
            <div className="text-4xl font-bold bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent mt-2">{security?.vulnerabilities || bugs.length}</div>
            <div className="text-xs text-slate-400 mt-2">Detected patterns</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Critical Security Issues */}
      {security && security.criticalIssues.length > 0 && (
        <motion.div 
          className="bg-red-900/20 backdrop-blur-xl border border-red-700/50 p-6 rounded-2xl shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ShieldAlert className="text-red-500" />
            </motion.div>
            Critical Security Issues
          </h2>
          <ul className="space-y-2">
            {security.criticalIssues.map((issue, idx) => (
              <li key={idx} className="text-red-200 text-sm flex items-start gap-2">
                <span className="text-red-500 mt-1">⚠</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
  
      {/* Predicted Bugs with Enhanced Info */}
      <motion.div 
        className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertTriangle className="text-red-400" />
          </motion.div>
          Predicted Bugs & Vulnerabilities
        </h2>
        <div className="space-y-4">
          {bugs.map((bug, idx) => (
            <motion.div 
              key={bug.id} 
              className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-xl border border-slate-600/50 hover:border-red-500/70 transition-all cursor-pointer group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.05 }}
              whileHover={{ scale: 1.01, x: 4 }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-md font-semibold text-white group-hover:text-red-400 transition-colors">{bug.message}</h4>
                    {bug.confidence && (
                      <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                        {bug.confidence}% confidence
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 font-mono">{bug.file}:{bug.line}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    bug.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                    bug.severity === 'HIGH' ? 'bg-orange-600 text-white' : 'bg-yellow-600 text-white'
                  }`}>
                    {bug.severity}
                  </span>
                  {bug.estimatedImpact && (
                    <span className="text-xs text-slate-400 text-center">{bug.estimatedImpact} Impact</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-xs mb-3">
                <span className="bg-slate-800 px-2 py-1 rounded text-slate-400">
                  Pattern: <span className="text-white">{bug.pattern}</span>
                </span>
                {bug.similarBugs && bug.similarBugs > 1 && (
                  <span className="bg-orange-900/50 px-2 py-1 rounded text-orange-300">
                    {bug.similarBugs} similar issues
                  </span>
                )}
              </div>

              {bug.fixSuggestion && (
                <motion.div 
                  className="bg-green-900/20 backdrop-blur-sm p-4 rounded-xl border border-green-700/50 mt-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-xs text-green-400 font-semibold mb-2 flex items-center gap-1">
                    <Sparkles size={14} /> Fix Suggestion:
                  </div>
                  <p className="text-sm text-slate-300">{bug.fixSuggestion}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
          {bugs.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
              </motion.div>
              <p className="text-slate-300 text-lg font-semibold">No bugs detected. Excellent code quality!</p>
              <p className="text-slate-500 text-sm mt-2">Your codebase is clean and secure 🎉</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const ArchGuardView: React.FC<EngineViewProps> = ({ data }) => {
  const violations = data.architectureViolations || [];
  const techDebt = data.techDebt;
  const complexity = data.complexity;
  const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length;
  const highCount = violations.filter(v => v.severity === 'HIGH').length;
  
  return (
    <div className="space-y-6">
      {/* Enhanced Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-purple-950/50 border border-purple-900 p-4 rounded-lg">
          <div className="text-purple-400 text-sm font-semibold uppercase">Critical Violations</div>
          <div className="text-3xl font-bold text-white mt-1">{criticalCount}</div>
          <div className="text-xs text-slate-400 mt-1">Architecture issues</div>
        </div>
        <div className="bg-orange-950/50 border border-orange-900 p-4 rounded-lg">
          <div className="text-orange-400 text-sm font-semibold uppercase">High Priority</div>
          <div className="text-3xl font-bold text-white mt-1">{highCount}</div>
          <div className="text-xs text-slate-400 mt-1">Needs review</div>
        </div>
        <div className={`border p-4 rounded-lg ${
          (techDebt?.score || 0) < 30 ? 'bg-green-950/50 border-green-900' :
          (techDebt?.score || 0) < 60 ? 'bg-yellow-950/50 border-yellow-900' : 'bg-red-950/50 border-red-900'
        }`}>
          <div className="text-white text-sm font-semibold uppercase">Tech Debt</div>
          <div className="text-3xl font-bold text-white mt-1">{techDebt?.score || 0}%</div>
          <div className="text-xs text-slate-400 mt-1">{techDebt?.estimatedHours || 0}h to fix</div>
        </div>
        <div className="bg-blue-950/50 border border-blue-900 p-4 rounded-lg">
          <div className="text-blue-400 text-sm font-semibold uppercase">Maintainability</div>
          <div className="text-3xl font-bold text-white mt-1">{complexity?.maintainabilityIndex || 0}%</div>
          <div className="text-xs text-slate-400 mt-1">Code health</div>
        </div>
      </div>

      {/* Technical Debt Summary */}
      {techDebt && techDebt.topIssues.length > 0 && (
        <div className="bg-yellow-950/20 border border-yellow-900 p-6 rounded-xl">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Technical Debt Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-slate-400">Debt Score</div>
              <div className="text-2xl font-bold text-white">{techDebt.score}/100</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Estimated Effort</div>
              <div className="text-2xl font-bold text-white">{techDebt.estimatedHours} hours</div>
            </div>
          </div>
          <div className="text-sm text-slate-400 mb-2">Top Issues:</div>
          <ul className="space-y-2">
            {techDebt.topIssues.map((issue, idx) => (
              <li key={idx} className="text-yellow-200 text-sm flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-slate-850 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <ShieldAlert className="text-purple-500" />
          Architecture Violations
        </h2>
        
        <div className="space-y-4">
          {violations.map(violation => (
            <div key={violation.id} className="bg-slate-900 p-6 rounded-lg border border-slate-800 hover:border-purple-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      violation.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                      violation.severity === 'HIGH' ? 'bg-orange-600 text-white' : 'bg-yellow-600 text-white'
                    }`}>
                      {violation.severity}
                    </span>
                    <span className="text-slate-400 text-sm font-mono">{violation.file}:{violation.line}</span>
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto mb-3">
                    <p className="text-slate-500">// {violation.file}</p>
                    <p className="text-purple-400">{violation.violation} <span className="text-red-500">{'// ❌ VIOLATION'}</span></p>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-red-400 font-semibold">Rule:</span>{' '}
                      <span className="text-white">{violation.rule}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">{violation.message}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <span className="text-green-400 font-semibold">💡 Suggestion:</span>{' '}
                      <span className="text-slate-300">{violation.suggestion}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {violations.length === 0 && (
            <div className="bg-green-950/20 border border-green-900/50 p-8 rounded-lg flex flex-col items-center justify-center text-center">
              <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
              <h3 className="text-xl font-bold text-green-400 mb-2">Clean Architecture Detected!</h3>
              <p className="text-slate-400">
                No architecture violations found. The codebase follows good separation of concerns and layering principles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CloudCostView: React.FC<EngineViewProps> = ({ data }) => {
  const costs = data.costs || [];
  const totalCurrent = costs.reduce((acc, curr) => acc + curr.current, 0);
  const totalOptimized = costs.reduce((acc, curr) => acc + curr.optimized, 0);
  const savings = totalCurrent - totalOptimized;
  const savingsPercentage = totalCurrent > 0 ? Math.round((savings / totalCurrent) * 100) : 0;

  // Group costs by category
  const categories = new Map<string, { current: number, optimized: number, count: number }>();
  costs.forEach(cost => {
    const cat = cost.category || 'Other';
    const existing = categories.get(cat) || { current: 0, optimized: 0, count: 0 };
    existing.current += cost.current;
    existing.optimized += cost.optimized;
    existing.count++;
    categories.set(cat, existing);
  });

  return (
    <div className="space-y-6">
      {/* Cost Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-950/50 border border-red-900 p-4 rounded-lg">
          <div className="text-red-400 text-sm font-semibold uppercase">Current Spend</div>
          <div className="text-3xl font-bold text-white mt-1">${totalCurrent}</div>
          <div className="text-xs text-slate-400 mt-1">Per month</div>
        </div>
        <div className="bg-green-950/50 border border-green-900 p-4 rounded-lg">
          <div className="text-green-400 text-sm font-semibold uppercase">Optimized</div>
          <div className="text-3xl font-bold text-white mt-1">${totalOptimized}</div>
          <div className="text-xs text-slate-400 mt-1">Target cost</div>
        </div>
        <div className="bg-blue-950/50 border border-blue-900 p-4 rounded-lg">
          <div className="text-blue-400 text-sm font-semibold uppercase">Savings</div>
          <div className="text-3xl font-bold text-white mt-1">${savings}</div>
          <div className="text-xs text-green-400 mt-1">{savingsPercentage}% reduction</div>
        </div>
        <div className="bg-purple-950/50 border border-purple-900 p-4 rounded-lg">
          <div className="text-purple-400 text-sm font-semibold uppercase">Services</div>
          <div className="text-3xl font-bold text-white mt-1">{costs.length}</div>
          <div className="text-xs text-slate-400 mt-1">Tracked resources</div>
        </div>
      </div>

      {/* Cost by Category */}
      {categories.size > 1 && (
        <div className="bg-slate-850 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Cost Breakdown by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from(categories.entries()).map(([category, data]) => (
              <div key={category} className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">{category}</div>
                <div className="text-2xl font-bold text-white">${data.current}</div>
                <div className="text-xs text-green-400 mt-1">
                  Save ${data.current - data.optimized}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Comparison Chart */}
      <div className="bg-slate-850 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="text-green-500" />
          Monthly Cost Optimization Analysis
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={costs}
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
              cursor={{fill: '#334155', opacity: 0.2}}
            />
            <Legend />
            <Bar dataKey="current" name="Current Cost ($)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="optimized" name="Optimized Cost ($)" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Optimization Recommendations */}
      <div className="bg-slate-850 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Optimization Recommendations</h2>
        <div className="space-y-4">
          {costs.filter(c => c.optimizationTips && c.optimizationTips.length > 0).map((cost, idx) => (
            <div key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-white">{cost.name}</h3>
                <div className="flex gap-2 items-center">
                  {cost.trend && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      cost.trend === 'increasing' ? 'bg-red-900/50 text-red-300' :
                      cost.trend === 'decreasing' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'
                    }`}>
                      {cost.trend === 'increasing' ? '📈' : cost.trend === 'decreasing' ? '📉' : '→'} {cost.trend}
                    </span>
                  )}
                  <span className="text-sm text-slate-400">{cost.category}</span>
                </div>
              </div>
              <div className="text-sm text-slate-400 mb-3">
                Current: ${cost.current} → Target: ${cost.optimized} 
                <span className="text-green-400 ml-2">(Save ${cost.current - cost.optimized})</span>
              </div>
              {cost.optimizationTips && (
                <div className="space-y-1">
                  {cost.optimizationTips.slice(0, 3).map((tip, tipIdx) => (
                    <div key={tipIdx} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">💡</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Potential Savings Banner */}
      <div className="bg-green-900/20 border border-green-900/50 p-6 rounded-xl flex items-center justify-between">
         <div>
           <h3 className="text-xl font-bold text-green-400">Total Potential Savings</h3>
           <p className="text-slate-400">Implement these optimizations to reduce costs by {savingsPercentage}%</p>
         </div>
         <div className="text-right">
           <div className="text-4xl font-bold text-white">
             ${savings.toLocaleString()}
           </div>
           <div className="text-sm text-slate-400 mt-1">per month</div>
           <div className="text-xs text-green-400 mt-1">
             ${(savings * 12).toLocaleString()}/year
           </div>
         </div>
      </div>
    </div>
  );
};

export const DataLineageView: React.FC<EngineViewProps> = ({ data }) => {
  const performance = data.performance;
  const nodes = data.lineageNodes || [];
  const links = data.lineageLinks || [];

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-950/50 border border-orange-900 p-4 rounded-lg">
            <div className="text-orange-400 text-sm font-semibold uppercase">Bottlenecks Detected</div>
            <div className="text-3xl font-bold text-white mt-1">{performance.bottlenecks.length}</div>
            <div className="text-xs text-slate-400 mt-1">Performance concerns</div>
          </div>
          <div className="bg-blue-950/50 border border-blue-900 p-4 rounded-lg">
            <div className="text-blue-400 text-sm font-semibold uppercase">Optimization Opportunities</div>
            <div className="text-3xl font-bold text-white mt-1">{performance.optimizationOpportunities}</div>
            <div className="text-xs text-slate-400 mt-1">Quick wins available</div>
          </div>
        </div>
      )}

      {/* Performance Bottlenecks */}
      {performance && performance.bottlenecks.length > 0 && (
        <div className="bg-slate-850 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" />
            Performance Bottlenecks
          </h2>
          <div className="space-y-2">
            {performance.bottlenecks.map((bottleneck, idx) => (
              <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
                <span className="text-white font-mono text-sm">{bottleneck}</span>
                <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-1 rounded">
                  Needs optimization
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Graph */}
      <div className="bg-slate-850 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Interactive Data Flow Graph</h2>
        <div className="h-[600px] overflow-hidden rounded-lg border border-slate-700">
          <LineageGraph nodes={nodes} links={links} />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-400">Database</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-slate-400">API</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-slate-400">Service</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-400">UI</span>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-3 text-center">
          💡 Drag nodes to explore dependencies • Hover for details • Colors indicate layer types
        </p>
      </div>

      {/* Dependency Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-850 p-4 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">Total Modules</div>
          <div className="text-2xl font-bold text-white">{nodes.length}</div>
        </div>
        <div className="bg-slate-850 p-4 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">Dependencies</div>
          <div className="text-2xl font-bold text-white">{links.length}</div>
        </div>
        <div className="bg-slate-850 p-4 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-sm mb-1">Coupling Score</div>
          <div className="text-2xl font-bold text-white">
            {nodes.length > 0 ? Math.min(10, Math.round((links.length / nodes.length) * 2)) : 0}/10
          </div>
        </div>
      </div>
    </div>
  );
};