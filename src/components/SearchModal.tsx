import React, { useState } from 'react';
import { Search, X, Radio, User, Shield } from 'lucide-react';
import { MatchData } from '../types';
import { TeamLogo } from './TeamLogo';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: MatchData[];
  onSelectMatch: (match: MatchData) => void;
  isDark: boolean;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  matches,
  onSelectMatch,
  isDark,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'matches' | 'teams' | 'players'>('all');

  if (!isOpen) return null;

  const filteredMatches = matches.filter((m) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      m.teamA.name.toLowerCase().includes(q) ||
      m.teamB.name.toLowerCase().includes(q) ||
      m.tournament.toLowerCase().includes(q) ||
      m.venue.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl p-5 space-y-4 ${
          isDark ? 'bg-[#091b2e] border-slate-700 text-white' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="relative flex-1 mr-3">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search matches, teams, tournaments..."
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200'
              }`}
            />
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          {['all', 'matches', 'teams', 'players'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize border ${
                filter === f
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredMatches.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matches found matching your search query.
            </div>
          ) : (
            filteredMatches.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  onSelectMatch(m);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-cyan-400/50 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-1.5 shrink-0">
                    <TeamLogo logo={m.teamA.logo} name={m.teamA.name} shortName={m.teamA.shortName} size="xs" />
                    <TeamLogo logo={m.teamB.logo} name={m.teamB.name} shortName={m.teamB.shortName} size="xs" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">{m.teamA.name} vs {m.teamB.name}</h4>
                    <p className="text-[10px] text-slate-400">{m.tournament}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">{m.currentInnings.score}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
