import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
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

  const getPlayerNamesForMatch = (m: MatchData): string[] => {
    const names = new Set<string>();
    if (m.playerOfMatch) names.add(m.playerOfMatch);
    const inningsList = m.innings && m.innings.length > 0 ? m.innings : m.currentInnings ? [m.currentInnings] : [];
    for (const inn of inningsList) {
      for (const b of inn.batters || []) {
        if (b.name) names.add(b.name);
      }
      for (const bw of inn.bowlers || []) {
        if (bw.name) names.add(bw.name);
      }
      for (const y of inn.yetToBat || []) {
        if (y) names.add(y);
      }
    }
    return Array.from(names);
  };

  const q = query.trim().toLowerCase();

  const filteredMatches = matches.filter((m) => {
    const players = getPlayerNamesForMatch(m);
    if (filter === 'players' && players.length === 0) return false;
    if (!q) return true;

    if (filter === 'teams') {
      return (
        m.teamA.name.toLowerCase().includes(q) ||
        m.teamA.shortName.toLowerCase().includes(q) ||
        m.teamB.name.toLowerCase().includes(q) ||
        m.teamB.shortName.toLowerCase().includes(q)
      );
    }

    if (filter === 'players') {
      return players.some((p) => p.toLowerCase().includes(q));
    }

    if (filter === 'matches') {
      return (
        m.title.toLowerCase().includes(q) ||
        m.tournament.toLowerCase().includes(q) ||
        m.venue.toLowerCase().includes(q) ||
        (m.matchType || '').toLowerCase().includes(q) ||
        (m.statusText || '').toLowerCase().includes(q)
      );
    }

    return (
      m.teamA.name.toLowerCase().includes(q) ||
      m.teamA.shortName.toLowerCase().includes(q) ||
      m.teamB.name.toLowerCase().includes(q) ||
      m.teamB.shortName.toLowerCase().includes(q) ||
      m.tournament.toLowerCase().includes(q) ||
      m.venue.toLowerCase().includes(q) ||
      (m.matchType || '').toLowerCase().includes(q) ||
      players.some((p) => p.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl p-5 space-y-4 ${
          isDark ? 'bg-[#091b2e] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="relative flex-1 mr-3">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search matches, teams, players, tournaments..."
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            />
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          {(['all', 'matches', 'teams', 'players'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize border transition-colors ${
                filter === f
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredMatches.length === 0 ? (
            <div className={`p-8 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {filter === 'players' && !q
                ? 'Open a match scorecard first to index player lineups, or search a team/match.'
                : 'No matches found matching your search query.'}
            </div>
          ) : (
            filteredMatches.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  onSelectMatch(m);
                  onClose();
                }}
                className={`p-3 rounded-2xl border hover:border-cyan-400/50 cursor-pointer flex items-center justify-between transition-colors ${
                  isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center -space-x-1.5 shrink-0">
                    <TeamLogo logo={m.teamA.logo} name={m.teamA.name} shortName={m.teamA.shortName} size="xs" />
                    <TeamLogo logo={m.teamB.logo} name={m.teamB.name} shortName={m.teamB.shortName} size="xs" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs truncate">
                      {m.teamA.name} vs {m.teamB.name}
                    </h4>
                    <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {m.tournament}
                      {m.matchType ? ` • ${m.matchType}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-mono font-bold shrink-0 ml-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                  {m.currentInnings.score}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
