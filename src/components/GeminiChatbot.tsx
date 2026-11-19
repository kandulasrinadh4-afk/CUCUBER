import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  Shield,
  Zap,
  BarChart2,
  BookOpen,
  MessageSquare,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { UserProfile, MatchData } from '../types';
import { ChatMessageRenderer } from './ChatMessageRenderer';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export type ChatRolePreset = 'general' | 'tactical' | 'umpire' | 'historian';

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  selectedMatch?: MatchData | null;
  isDark?: boolean;
}

const INITIAL_PROMPTS = [
  { icon: '🏆', label: 'Latest IPL Updates', query: 'What are the latest IPL scores, team standings, and player news?' },
  { icon: '🌐', label: 'Live International', query: 'What are today’s live international cricket matches, Test & T20 series updates?' },
  { icon: '🏏', label: 'Domestic & Ranji', query: 'Give me real-time updates on Ranji Trophy, County Championship, and national domestic leagues.' },
  { icon: '⚡', label: 'Global Leagues', query: 'What is happening in SA20, BBL, PSL, CPL, and MLC tournaments?' },
  { icon: '🎯', label: 'Tactical Analysis', query: 'Analyze current match momentum, pitch telemetry, and win probability.' },
];

export function GeminiChatbot({
  isOpen,
  onClose,
  user,
  selectedMatch,
  isDark = true,
}: GeminiChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: `Hello ${user.name || 'Cricket Fan'}! I'm **Apex Gemini AI**, powered by real-time Google Search Grounding. 

I provide **live, up-to-the-minute updates** across **ALL** cricket levels:
• 🌐 **International**: Tests, ODIs, T20Is & WTC
• 🏆 **IPL**: Real-time scores, squads, standings & auctions
• 🏏 **Domestic & National**: Ranji Trophy, County Championship, Vijay Hazare, Sheffield Shield
• ⚡ **Franchise Leagues**: SA20, BBL, PSL, CPL, ILT20, BPL
• 🤝 **Unofficial & A-Teams**: India A, Australia A & Development tours

${
  selectedMatch
    ? `I'm currently tracking **${selectedMatch.teamA.shortName} vs ${selectedMatch.teamB.shortName}** live.`
    : 'Ask me anything about current live scores, squad news, player stats, rules, or tactical projections!'
}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rolePreset, setRolePreset] = useState<ChatRolePreset>('general');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSend = async (customMessage?: string) => {
    const messageToSend = (customMessage || input).trim();
    if (!messageToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customMessage) setInput('');
    setIsLoading(true);

    try {
      // Build history for API (strip IDs/timestamps for Gemini)
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyPayload,
          message: messageToSend,
          rolePreset,
          matchContext: selectedMatch
            ? {
                teams: `${selectedMatch.teamA.name} vs ${selectedMatch.teamB.name}`,
                scoreA: `${selectedMatch.teamA.score || '0/0'} (${selectedMatch.teamA.overs || '0.0'} ovs)`,
                scoreB: `${selectedMatch.teamB.score || '0/0'} (${selectedMatch.teamB.overs || '0.0'} ovs)`,
                status: selectedMatch.status,
                venue: selectedMatch.venue,
                target: selectedMatch.target,
              }
            : null,
          userContext: {
            favoriteTeams: user.favoriteTeams,
            favoritePlayers: user.favoritePlayers,
          },
        }),
      });

      const data = await res.json();
      const aiReplyText = data.text || data.answer || 'No response received.';

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: "I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: 'Conversation history cleared. How can I assist your cricket analysis now?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 flex flex-col shadow-2xl border ${
        isExpanded
          ? 'inset-2 sm:inset-6 md:inset-12 rounded-2xl'
          : 'bottom-4 right-4 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] rounded-2xl'
      } ${
        isDark
          ? 'bg-[#0a1e36] border-cyan-500/30 text-slate-100 shadow-cyan-950/50'
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-400/30'
      }`}
    >
      {/* Header */}
      <div
        className={`p-3.5 px-4 rounded-t-2xl flex items-center justify-between border-b ${
          isDark
            ? 'bg-[#0f2847] border-cyan-500/20 text-white'
            : 'bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border-slate-200 text-white'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-md shadow-cyan-500/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                Apex Gemini AI
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-medium">
                  3.6-Flash
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-cyan-200/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
              Live Google Search Grounding • All Cricket
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimize' : 'Maximize'}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleClearHistory}
            title="Clear Chat History"
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role Selection & Context Ribbon */}
      <div
        className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
          isDark ? 'bg-[#07172b] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-medium text-slate-400">Role:</span>
          <select
            value={rolePreset}
            onChange={(e) => setRolePreset(e.target.value as ChatRolePreset)}
            className={`text-xs px-2 py-1 rounded-lg border outline-none font-medium cursor-pointer transition ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-cyan-300 focus:border-cyan-500'
                : 'bg-white border-slate-300 text-slate-800 focus:border-cyan-600'
            }`}
          >
            <option value="general">🏏 General Assistant</option>
            <option value="tactical">📈 Tactical Pundit</option>
            <option value="umpire">⚖️ Umpire & Rules</option>
            <option value="historian">📚 Stats Historian</option>
          </select>
        </div>

        {selectedMatch && (
          <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Match Attached: <span className="font-semibold">{selectedMatch.teamA.shortName} vs {selectedMatch.teamB.shortName}</span>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                {!isUser && (
                  <span className="font-semibold text-cyan-400 flex items-center gap-1">
                    <Bot className="w-3 h-3" /> Apex Gemini
                  </span>
                )}
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`relative max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none'
                    : isDark
                    ? 'bg-[#102a4a] border border-cyan-500/20 text-slate-100 rounded-bl-none'
                    : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-none'
                }`}
              >
                {isUser ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <ChatMessageRenderer text={msg.text} isDark={isDark} />
                )}

                {/* Quick Copy Button */}
                <button
                  onClick={() => handleCopy(msg.id, msg.text)}
                  className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 rounded ${
                    isUser
                      ? 'hover:bg-white/20 text-white'
                      : isDark
                      ? 'hover:bg-slate-800 text-slate-400'
                      : 'hover:bg-slate-200 text-slate-600'
                  }`}
                  title="Copy message"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {/* Loading / Typing Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-950/40 p-2.5 px-3.5 rounded-2xl w-fit border border-cyan-800/30">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Apex AI is analyzing telemetry...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      {messages.length < 5 && (
        <div
          className={`p-2 px-3 border-t overflow-x-auto flex items-center gap-1.5 scrollbar-none ${
            isDark ? 'bg-[#07172b] border-slate-800/60' : 'bg-slate-50 border-slate-200'
          }`}
        >
          {INITIAL_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.query)}
              disabled={isLoading}
              className={`whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full border transition flex items-center gap-1 ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700/80 hover:bg-cyan-950 hover:border-cyan-500/50 text-slate-200'
                  : 'bg-white border-slate-300 hover:bg-cyan-50 hover:border-cyan-300 text-slate-700'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className={`p-3 border-t flex items-center gap-2 rounded-b-2xl ${
          isDark ? 'bg-[#0a1e36] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            selectedMatch
              ? `Ask about ${selectedMatch.teamA.shortName} vs ${selectedMatch.teamB.shortName}...`
              : 'Ask Apex AI anything about cricket...'
          }
          disabled={isLoading}
          className={`flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border outline-none transition ${
            isDark
              ? 'bg-[#051424] border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500'
              : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600'
          }`}
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-md shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
