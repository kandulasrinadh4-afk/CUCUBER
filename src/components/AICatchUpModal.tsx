import React, { useState, useEffect } from 'react';
import { X, TrendingUp, AlertTriangle, Radio, MapPin, Award, Info } from 'lucide-react';
import { MatchData } from '../types';
import { fetchMatchSummary } from '../services/cricketDataService';

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
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    summary?: string;
    topPerformers?: string[];
    turningPoints?: string[];
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);
    fetchMatchSummary(match.id)
      .then((data) => {
        if (isMounted) setSummaryData(data);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen, match.id]);

  if (!isOpen) return null;

  const recentBalls = match.recentBalls || [];

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
        <div
          className={`sticky top-0 z-10 p-6 border-b backdrop-blur-lg flex items-center justify-between bg-inherit ${
            isDark ? 'border-slate-700/50' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight">Official Match Brief</h3>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
                    isDark
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                  }`}
                >
                  Sportmonks Feed
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>
                {match.teamA.name} vs {match.teamB.name}
                {match.currentInnings?.score && match.currentInnings.score !== 'TBA'
                  ? ` • ${match.currentInnings.score} (${match.currentInnings.overs || '0'} Ovs)`
                  : ''}
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
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-4 border-t-cyan-400 border-r-teal-400 border-b-transparent border-l-transparent animate-spin" />
              <p className="text-xs font-semibold text-cyan-400 font-mono">
                Loading verified match telemetry...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Official Match Status / Summary */}
              <div
                className={`p-5 rounded-2xl border ${
                  isDark
                    ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-100'
                    : 'bg-cyan-50 border-cyan-200 text-cyan-950'
                }`}
              >
                <div
                  className={`flex items-center gap-2 mb-2 font-bold text-xs uppercase font-mono tracking-wider ${
                    isDark ? 'text-cyan-400' : 'text-cyan-800'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  Official Match Snapshot
                </div>
                <p className="text-sm leading-relaxed font-medium">
                  {summaryData?.summary || match.matchSummary || match.statusText}
                </p>
              </div>

              {/* Verified Scorecard Highlights & Recent Balls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h4
                    className={`text-xs font-bold font-mono uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Verified Top Performers
                  </h4>
                  {summaryData?.topPerformers && summaryData.topPerformers.length > 0 ? (
                    <ul className="space-y-2 text-xs">
                      {summaryData.topPerformers.map((perf, idx) => (
                        <li
                          key={idx}
                          className={`flex items-start gap-2 ${
                            isDark ? 'text-slate-300' : 'text-slate-800 font-medium'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                          <span>{perf}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Open the Scorecard tab in Match Center once innings statistics are recorded.
                    </p>
                  )}
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h4
                    className={`text-xs font-bold font-mono uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Recent Deliveries
                  </h4>
                  {recentBalls.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {recentBalls.map((b, i) => (
                        <span
                          key={i}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${
                            b === 'W'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : b === '6'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : b === '4'
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                              : isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-300'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Ball-by-ball updates not yet available for this match.
                    </p>
                  )}
                </div>
              </div>

              {/* Verified Fixture Metadata (Venue, Toss, POTM, Officials) */}
              <div
                className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs ${
                  isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
                  <div>
                    <span className={`block text-[10px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Venue
                    </span>
                    <span className="font-semibold">
                      {match.venue || 'TBA'}
                      {match.city ? `, ${match.city}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Award className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <div>
                    <span className={`block text-[10px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {match.playerOfMatch ? 'Player of the Match' : 'Toss & Format'}
                    </span>
                    <span className="font-semibold">
                      {match.playerOfMatch || match.toss || match.matchType || match.tournament}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
