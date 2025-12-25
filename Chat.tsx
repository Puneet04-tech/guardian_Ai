import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createChatSession, sendMessageToGemini } from '../services/geminiService';
import { ChatMessage, AnalysisResult } from '../types';

interface ChatProps {
  isOpen: boolean;
  analysisData: AnalysisResult | null;
  repoUrl: string;
}

// Format message text with markdown-like formatting
const formatMessage = (text: string): string => {
  return text
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // Code blocks
    .replace(/`([^`]+)`/g, '<code class="bg-slate-900/80 px-2 py-0.5 rounded text-cyan-400 font-mono text-xs">$1</code>')
    // Line breaks
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
    // Bullet points
    .replace(/^[\-•]\s(.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-blue-400">•</span><span>$1</span></div>')
    // Numbered lists
    .replace(/^(\d+)\.\s(.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-blue-400 font-semibold">$1.</span><span>$2</span></div>')
    // Headings
    .replace(/^###\s(.+)$/gm, '<h3 class="text-base font-bold text-white mt-3 mb-2">$1</h3>')
    .replace(/^##\s(.+)$/gm, '<h2 class="text-lg font-bold text-white mt-4 mb-2">$1</h2>')
    // Checkmarks and icons (preserve emojis)
    .replace(/✅/g, '<span class="text-green-400">✅</span>')
    .replace(/⚠️/g, '<span class="text-yellow-400">⚠️</span>')
    .replace(/❌/g, '<span class="text-red-400">❌</span>')
    .replace(/🔍/g, '<span class="text-blue-400">🔍</span>')
    .replace(/💡/g, '<span class="text-yellow-400">💡</span>')
    .replace(/🐛/g, '<span class="text-red-400">🐛</span>')
    .replace(/🔒/g, '<span class="text-green-400">🔒</span>')
    .replace(/💰/g, '<span class="text-yellow-400">💰</span>')
    .replace(/🏗️/g, '<span class="text-orange-400">🏗️</span>')
    .replace(/👥/g, '<span class="text-purple-400">👥</span>')
    .replace(/📁/g, '<span class="text-blue-400">📁</span>')
    .replace(/👋/g, '<span>👋</span>');
};

export const Chat: React.FC<ChatProps> = ({ isOpen, analysisData, repoUrl }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: analysisData 
      ? `Hello! 👋 I am **Guardian AI**, powered by Google Gemini 2.5 Flash.\n\nI've analyzed **${analysisData.repoName || repoUrl}** and have insights about:\n\n✅ **${analysisData.bugs?.length || 0}** bugs detected\n🏗️ **${analysisData.architectureViolations?.length || 0}** architecture issues\n💰 **${analysisData.costs?.length || 0}** cost optimization opportunities\n👥 **${analysisData.developers?.length || 0}** active contributors\n📁 **${analysisData.repositoryFiles?.length || 0}** files analyzed\n\nAsk me anything about your codebase!`
      : 'Hello! I am **Guardian AI**. Analyze a repository first, then I can answer questions about your codebase.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Simple session management for chat history
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize session once
    if (!chatSessionRef.current) {
      chatSessionRef.current = createChatSession();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Send repository context with the message
      const responseText = await sendMessageToGemini(chatSessionRef.current, userMsg.text, analysisData, repoUrl);
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (e) {
      console.error(e);
      const errorMsg: ChatMessage = {
         id: (Date.now() + 1).toString(),
         role: 'model',
         text: "I cannot connect to Google Gemini right now. Please check your GEMINI_API_KEY.",
         timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="flex flex-col h-full bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 w-96 fixed right-0 top-0 bottom-0 shadow-2xl z-20"
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header with gradient */}
      <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center gap-3 relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="relative z-10 p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Bot className="text-white" size={20} />
        </motion.div>
        <div className="relative z-10">
          <h2 className="font-bold text-white flex items-center gap-2">
            CodeIntel Copilot
            <Sparkles size={14} className="text-cyan-400" />
          </h2>
          <p className="text-xs text-slate-400">Powered by Google Gemini</p>
        </div>
      </div>

      {/* Messages Area with smooth animations */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <motion.div 
              key={msg.id} 
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <motion.div 
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg shadow-blue-500/30' 
                    : 'bg-slate-800 border border-slate-700'
                }`}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {msg.role === 'user' ? (
                  <User size={18} className="text-white" />
                ) : (
                  <Bot size={18} className="text-blue-400" />
                )}
              </motion.div>
              <motion.div 
                className={`p-4 rounded-2xl text-sm max-w-[80%] backdrop-blur-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-slate-800/50 text-slate-200 border border-slate-700/50'
                }`}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div 
                  className="prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessage(msg.text) 
                  }}
                />
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Typing Indicator */}
        {isLoading && (
          <motion.div 
            className="flex gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Bot size={18} className="text-blue-400" />
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl flex items-center gap-2 border border-slate-700/50">
              <motion.div
                className="flex gap-1"
                initial="initial"
                animate="animate"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-blue-400 rounded-full"
                    animate={{
                      y: [0, -8, 0],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.15
                    }}
                  />
                ))}
              </motion.div>
              <span className="text-slate-400 text-xs ml-2">AI is thinking...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with glassmorphism */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="flex gap-2">
          <motion.input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Copilot anything..."
            className="flex-1 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            whileFocus={{ scale: 1.01 }}
          />
          <motion.button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
            <Send size={18} className="relative z-10" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
