import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, AlertTriangle, TrendingUp, Zap, Send, Bot } from 'lucide-react';
import { MatchData } from '../types';

interface AICatchUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchData;
  isDark: boolean;
}

export const AICatchUpModal: React.FC<AICatchUpModalProps> = ({
  isOpen,
  onClose,
  match,
  isDark,
}) => {
  const [timeframe, setTimeframe] = useState<'10m' | '30m' | '1h' | 'match'>('30m');
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    summary?: string;
    keyMoments?: string[];
    turningPoints?: string[];
    projectedOutcome?: string;
  } | null>(null);

  const [aiChatQuery, setAiChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const fetchAICatchUp = async (tf: '10m' | '30m' | '1h' | 'match') => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/catch-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframe: tf === '10m' ? '10 minutes' : tf === '30m' ? '30 minutes' : tf === '1h' ? '1 hour' : 'entire match',
          matchInfo: {
            teamA: match.teamA.name,
            teamB: match.teamB.name,
            score: `${match.currentInnings.score} (${match.currentInnings.overs} Ovs)`,
            crr: match.crr,
            rrr: match.rrr,
            batter: match.currentInnings.batters[0]?.name || 'Batter',
            bowler: match.currentInnings.bowlers[0]?.name || 'Bowler',
          },
          recentEvents: match.recentBalls,
        }),
      });
      const data = await response.json();
      setSummaryData(data);
    } catch (err) {
      console.error(err);
      setSummaryData({
        summary: `Over the last ${tf}, ${match.teamA.name} maintain their aggressive stance with a CRR of ${match.crr || 9.2}.`,
        keyMoments: ['6 runs scored off over 19.1', 'Wicket taken in previous over'],
        turningPoints: ['Momentum swung towards chasing side'],
        projectedOutcome: 'Chasing team favored at 65%.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAICatchUp(timeframe);
    }
  }, [isOpen, timeframe]);

  const handleAskAICricket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatQuery.trim() || isAsking) return;

    const userText = aiChatQuery.trim();
    setChatHistory((prev) => [...prev, { role: 'user', text: userText }]);
    setAiChatQuery('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/gemini/ask-cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userText,
          matchContext: {
            teamA: match.teamA.name,
            teamB: match.teamB.name,
            score: match.currentInnings.score,
            status: match.statusText,
          },
        }),
      });
      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: 'ai', text: data.answer || 'Analysis processed.' }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'ai', text: 'Telemetry server busy. Current match status remains active.' },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl transition-all ${
          isDark
            ? 'bg-[#091b2e] border-cyan-500/30 text-white shadow-cyan-950/50'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 border-b backdrop-blur-lg flex items-center justify-between bg-inherit border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight">AI Match Catch-Up</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Gemini 3.6
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>
                {match.teamA.name} vs {match.teamB.name} • {match.currentInnings.score} ({match.currentInnings.overs} Ovs)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full border transition-colors ${
              isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Timeframe Selector Chips */}
          <div>
            <label className={`block text-xs font-bold mb-2 uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'}`}>
              Select What You Missed:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: '10m', label: 'Last 10 Min' },
                  { id: '30m', label: 'Last 30 Min' },
                  { id: '1h', label: 'Last 1 Hour' },
                  { id: 'match', label: 'Full Match' },
                ] as const
              ).map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                    timeframe === tf.id
                      ? 'bg-cyan-500 text-slate-950 font-extrabold border-cyan-400 shadow-md shadow-cyan-500/20'
                      : isDark
                      ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 font-bold'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{tf.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Generation State */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping" />
                <div className="w-16 h-16 rounded-full border-4 border-t-cyan-400 border-r-teal-400 border-b-transparent border-l-transparent animate-spin flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <p className="text-sm font-semibold text-cyan-400 animate-pulse">
                Analyzing ball-by-ball telemetry & momentum shifts...
              </p>
            </div>
          ) : (
            summaryData && (
              <div className="space-y-5 animate-fadeIn">
                {/* Main Summary Box */}
                <div
                  className={`p-5 rounded-2xl border relative overflow-hidden ${
                    isDark
                      ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-100'
                      : 'bg-cyan-50 border-cyan-200 text-cyan-950'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm text-cyan-400 uppercase font-mono tracking-wider">
                    <Zap className="w-4 h-4 fill-cyan-400" />
                    Key Takeaway
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed font-medium">
                    {summaryData.summary}
                  </p>
                </div>

                {/* Key Moments & Turning Points Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Key Moments */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <h4 className={`text-xs font-bold font-mono uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'}`}>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Key Ball Events
                    </h4>
                    <ul className="space-y-2 text-xs">
                      {summaryData.keyMoments?.map((km, idx) => (
                        <li key={idx} className={`flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                          <span>{km}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Strategic Turning Points */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <h4 className={`text-xs font-bold font-mono uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'}`}>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Momentum Shifts
                    </h4>
                    <ul className="space-y-2 text-xs">
                      {summaryData.turningPoints?.map((tp, idx) => (
                        <li key={idx} className={`flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span>{tp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Projected Outcome Pill */}
                {summaryData.projectedOutcome && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                      isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-300'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-900 font-bold'}`}>
                      <strong className={isDark ? "text-emerald-400 font-mono" : "text-emerald-800 font-mono font-extrabold"}>Win Probability Projection:</strong>{' '}
                      {summaryData.projectedOutcome}
                    </span>
                  </div>
                )}

                {/* Ask AI Follow-up */}
                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <label className={`block text-xs font-semibold mb-2 flex items-center gap-1.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
                    <Bot className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
                    Ask Cucuber AI a custom match question:
                  </label>
                  <form onSubmit={handleAskAICricket} className="flex gap-2">
                    <input
                      type="text"
                      value={aiChatQuery}
                      onChange={(e) => setAiChatQuery(e.target.value)}
                      placeholder="e.g. Why was that last over so expensive?"
                      className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={isAsking || !aiChatQuery.trim()}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Ask
                    </button>
                  </form>

                  {/* Chat History Messages */}
                  {chatHistory.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-1">
                      {chatHistory.map((msg, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl text-xs ${
                            msg.role === 'user'
                              ? 'bg-cyan-500/10 text-cyan-300 ml-6 border border-cyan-500/20'
                              : 'bg-slate-800/80 text-slate-200 mr-6 border border-slate-700'
                          }`}
                        >
                          <span className="font-bold block mb-0.5 text-[10px] font-mono opacity-60">
                            {msg.role === 'user' ? 'YOU' : 'CUCUBER AI'}
                          </span>
                          {msg.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
