import React, { useState } from 'react';
import {
  Radio,
  Search,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Filter,
  Flame,
  Zap,
  Bell,
  ExternalLink,
} from 'lucide-react';
import { MatchData, UserProfile } from '../types';
import { TeamLogo } from './TeamLogo';

interface MatchesViewProps {
  matches: MatchData[];
  user: UserProfile;
  onSelectMatch: (match: MatchData) => void;
  onOpenCatchUp: (match: MatchData) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const MatchCard: React.FC<{
  match: MatchData;
  isDark: boolean;
  onSelectMatch: (match: MatchData) => void;
  onOpenCatchUp: (match: MatchData) => void;
}> = ({ match, isDark, onSelectMatch, onOpenCatchUp }) => {
  const isLive = match.status === 'LIVE';
  const isInterrupted = match.status === 'INTERRUPTED';

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 hover:border-cyan-500/50 hover:shadow-xl ${
        isDark
          ? 'bg-[#091b2e] border-slate-800 text-white shadow-cyan-950/20'
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-200'
      }`}
    >
      {/* Header info */}
      <div
        className={`p-4 border-b flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800/50' : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        <span
          className={`font-medium truncate max-w-[220px] ${
            isDark ? 'text-slate-400' : 'text-slate-700 font-bold'
          }`}
        >
          {match.tournament}
        </span>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] font-bold flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              LIVE
            </span>
          )}
          {isInterrupted && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 font-mono">
              <AlertCircle className="w-3 h-3" />
              INTERRUPTED
            </span>
          )}
          {match.status === 'UPCOMING' && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 border border-blue-500/30 text-[10px] font-bold font-mono">
              UPCOMING
            </span>
          )}
          {match.status === 'RECENT' && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-200 text-slate-800'
              }`}
            >
              RESULT
            </span>
          )}
        </div>
      </div>

      {/* Body Area */}
      <div className="p-5 cursor-pointer space-y-4" onClick={() => onSelectMatch(match)}>
        {/* Team A */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo
              logo={match.teamA.logo}
              name={match.teamA.name}
              shortName={match.teamA.shortName}
              size="md"
            />
            <div>
              <p className="font-bold text-base leading-tight">{match.teamA.name}</p>
              <p className={isDark ? 'text-xs text-slate-400' : 'text-xs text-slate-600 font-medium'}>
                {match.teamA.shortName}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-mono font-black tracking-tight">{match.teamA.score}</p>
            <p
              className={
                isDark
                  ? 'text-[11px] text-slate-400 font-mono'
                  : 'text-[11px] text-slate-600 font-mono font-semibold'
              }
            >
              {match.teamA.overs ? `${match.teamA.overs} ov` : ''}
            </p>
          </div>
        </div>

        {/* Team B */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo
              logo={match.teamB.logo}
              name={match.teamB.name}
              shortName={match.teamB.shortName}
              size="md"
            />
            <div>
              <p className="font-bold text-base leading-tight">{match.teamB.name}</p>
              <p className={isDark ? 'text-xs text-slate-400' : 'text-xs text-slate-600 font-medium'}>
                {match.teamB.shortName}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-mono font-black tracking-tight">{match.teamB.score || '-'}</p>
            <p
              className={
                isDark
                  ? 'text-[11px] text-slate-400 font-mono'
                  : 'text-[11px] text-slate-600 font-mono font-semibold'
              }
            >
              {match.teamB.overs ? `${match.teamB.overs} ov` : ''}
            </p>
          </div>
        </div>

        {/* Context Pill */}
        <div
          className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            isInterrupted
              ? isDark
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'bg-amber-100 text-amber-950 border border-amber-300 font-bold'
              : isDark
              ? 'bg-slate-800/60 text-cyan-300 border border-slate-700/50'
              : 'bg-cyan-50/80 text-cyan-950 border border-cyan-200 font-bold shadow-2xs'
          }`}
        >
          <span className="truncate pr-2">{match.statusText}</span>
          {match.crr && (
            <span
              className={`font-mono text-[10px] shrink-0 ${
                isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'
              }`}
            >
              CRR: {match.crr}
            </span>
          )}
        </div>

        {/* Recent Ball Line */}
        {match.recentBalls && match.recentBalls.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            <span
              className={`text-[10px] font-mono mr-1 uppercase ${
                isDark ? 'text-slate-500' : 'text-slate-700 font-bold'
              }`}
            >
              Recent:
            </span>
            {match.recentBalls.map((ball, i) => {
              let ballStyle = isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
              if (ball === 'W') ballStyle = 'bg-red-500 text-white font-bold border-red-400';
              if (ball === '6') ballStyle = 'bg-amber-500 text-slate-950 font-bold border-amber-300';
              if (ball === '4') ballStyle = 'bg-cyan-500 text-slate-950 font-bold border-cyan-300';
              if (ball === 'RAINDELAY')
                ballStyle = 'bg-amber-600 text-white font-bold border-amber-400 text-[9px] px-2';

              return (
                <span
                  key={i}
                  className={`w-6 h-6 rounded-full border text-[11px] font-mono flex items-center justify-center shrink-0 ${ballStyle}`}
                >
                  {ball === 'RAINDELAY' ? 'RAIN' : ball}
                </span>
              );
            })}
          </div>
        )}

        {/* Grounding Source Attribution */}
        {match.sourceUrl && (
          <div className="pt-1 flex items-center justify-between text-[11px] font-mono border-t border-slate-500/10">
            <span className={isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}>Data:</span>
            <a
              href={match.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-cyan-500 hover:underline flex items-center gap-1 font-bold"
            >
              <span>Verified from web</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div
        className={`p-3 border-t flex items-center justify-between gap-2 ${
          isDark ? 'bg-slate-950/30 border-slate-800/50' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <button
          onClick={() => onOpenCatchUp(match)}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            isDark
              ? 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30'
              : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-950 border border-cyan-300 font-extrabold shadow-2xs'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Catch-Up</span>
        </button>

        <button
          onClick={() => onSelectMatch(match)}
          className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1 transition-all shadow-md shadow-cyan-500/20"
        >
          <span>Match Center</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const LiveMatchCardSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all ${
        isDark
          ? 'bg-[#091b2e] border-slate-800 text-white shadow-cyan-950/10'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Header: Tournament/Series Name & Match Status Skeleton */}
      <div
        className={`p-4 border-b flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800/50 bg-slate-900/40' : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`h-3.5 w-36 sm:w-44 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <span className={`text-[10px] font-mono hidden sm:inline ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            • Tournament Series
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono uppercase flex items-center gap-1.5 ${
            isDark ? 'bg-slate-800 text-cyan-400 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          STANDBY
        </span>
      </div>

      {/* Body Area: Team Sections & Score Areas */}
      <div className="p-5 space-y-4">
        {/* Team A Row Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono text-xs font-bold border animate-pulse ${
                isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              T1
            </div>
            <div className="space-y-1.5">
              <div className={`h-4 w-28 sm:w-36 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className={`h-3 w-12 rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`} />
            </div>
          </div>
          <div className="text-right space-y-1.5">
            <div className={`h-5 w-16 rounded ml-auto animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div className={`h-3 w-10 rounded ml-auto animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`} />
          </div>
        </div>

        {/* Team B Row Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono text-xs font-bold border animate-pulse ${
                isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              T2
            </div>
            <div className="space-y-1.5">
              <div className={`h-4 w-28 sm:w-36 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className={`h-3 w-12 rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`} />
            </div>
          </div>
          <div className="text-right space-y-1.5">
            <div className={`h-5 w-16 rounded ml-auto animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div className={`h-3 w-10 rounded ml-auto animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`} />
          </div>
        </div>

        {/* Match Situation & Run Rate Bar */}
        <div
          className={`p-3 rounded-2xl text-xs flex items-center justify-between gap-2 ${
            isDark
              ? 'bg-slate-800/50 text-slate-300 border border-slate-700/50'
              : 'bg-slate-50 text-slate-700 border border-slate-200 font-medium'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDark ? 'bg-cyan-400' : 'bg-cyan-600'} animate-pulse`} />
            <div className={`h-3.5 w-44 sm:w-60 rounded animate-pulse ${isDark ? 'bg-slate-700/60' : 'bg-slate-300'}`} />
          </div>
          <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500 font-bold'}>CRR</span>
            <div className={`h-3.5 w-8 rounded animate-pulse ${isDark ? 'bg-slate-700/60' : 'bg-slate-300'}`} />
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div
        className={`p-3 border-t flex items-center justify-between gap-2 ${
          isDark ? 'bg-slate-950/30 border-slate-800/50' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <button
          disabled
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed ${
            isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Catch-Up</span>
        </button>

        <button
          disabled
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed ${
            isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          <span>Match Center</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const UpcomingMatchCardSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all ${
        isDark
          ? 'bg-[#091b2e] border-slate-800 text-white shadow-cyan-950/10'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Header: Competition & Date/Time Skeleton */}
      <div
        className={`p-4 border-b flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800/50 bg-slate-900/40' : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        <div className="space-y-1">
          <div className={`h-3.5 w-32 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <div className={`h-2.5 w-24 rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/70'}`} />
        </div>
        {/* Date/Time badge skeleton */}
        <div className={`h-5 w-20 rounded-md animate-pulse ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`} />
      </div>

      {/* Body: Teams & VS indicator & Venue */}
      <div className="p-5 space-y-4">
        {/* Team 1 & Team 2 vs Layout */}
        <div className="flex items-center justify-between gap-3">
          {/* Team 1 */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono text-xs font-bold border shrink-0 animate-pulse ${
                isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              T1
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className={`h-4 w-20 sm:w-24 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className={`h-3 w-10 rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`} />
            </div>
          </div>

          {/* VS indicator */}
          <div className="shrink-0 px-2 py-1 rounded-lg bg-slate-800/20 dark:bg-slate-800/50 text-[11px] font-mono font-bold text-slate-400">
            VS
          </div>

          {/* Team 2 */}
          <div className="flex items-center justify-end gap-2.5 min-w-0 text-right">
            <div className="space-y-1.5 min-w-0">
              <div className={`h-4 w-20 sm:w-24 ml-auto rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className={`h-3 w-10 ml-auto rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`} />
            </div>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono text-xs font-bold border shrink-0 animate-pulse ${
                isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              T2
            </div>
          </div>
        </div>

        {/* Venue Skeleton */}
        <div
          className={`p-3 rounded-2xl text-xs flex items-center justify-between ${
            isDark
              ? 'bg-slate-800/40 text-slate-400 border border-slate-700/40'
              : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Venue:</span>
            <div className={`h-3 w-32 rounded animate-pulse ${isDark ? 'bg-slate-700/60' : 'bg-slate-300'}`} />
          </div>
          <div className={`h-3 w-16 rounded animate-pulse ${isDark ? 'bg-slate-700/60' : 'bg-slate-300'}`} />
        </div>
      </div>

      {/* Footer Buttons */}
      <div
        className={`p-3 border-t flex items-center justify-between gap-2 ${
          isDark ? 'bg-slate-950/30 border-slate-800/50' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <button
          disabled
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed ${
            isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Set Reminder</span>
        </button>
        <button
          disabled
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed ${
            isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          <span>Match Info</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const RecentResultCardSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all ${
        isDark
          ? 'bg-[#091b2e] border-slate-800 text-white shadow-cyan-950/10'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Header: Competition Skeleton & Date Skeleton */}
      <div
        className={`p-4 border-b flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800/50 bg-slate-900/40' : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        <div className="space-y-1">
          <div className={`h-3.5 w-32 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <div className={`h-2.5 w-20 rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/70'}`} />
        </div>
        {/* Date / Result badge skeleton */}
        <div className={`h-5 w-20 rounded-full animate-pulse ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`} />
      </div>

      {/* Body: Team Logo, Name, and Score Skeletons */}
      <div className="p-5 space-y-4">
        {/* Team 1 Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono text-xs font-bold border animate-pulse ${
                isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              T1
            </div>
            <div className="space-y-1.5">
              <div className={`h-4 w-28 sm:w-36 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className={`h-3 w-12 rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`} />
            </div>
          </div>
          <div className="text-right space-y-1.5">
            <div className={`h-5 w-16 rounded ml-auto animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div className={`h-3 w-10 rounded ml-auto animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`} />
          </div>
        </div>

        {/* Team 2 Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono text-xs font-bold border animate-pulse ${
                isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              T2
            </div>
            <div className="space-y-1.5">
              <div className={`h-4 w-28 sm:w-36 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className={`h-3 w-12 rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`} />
            </div>
          </div>
          <div className="text-right space-y-1.5">
            <div className={`h-5 w-16 rounded ml-auto animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div className={`h-3 w-10 rounded ml-auto animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/60'}`} />
          </div>
        </div>

        {/* Result/Status Skeleton */}
        <div
          className={`p-3 rounded-2xl text-xs flex items-center justify-between ${
            isDark
              ? 'bg-slate-800/50 text-slate-300 border border-slate-700/50'
              : 'bg-slate-50 text-slate-700 border border-slate-200 font-medium'
          }`}
        >
          <div className={`h-3.5 w-48 rounded animate-pulse ${isDark ? 'bg-slate-700/60' : 'bg-slate-300'}`} />
          <div className={`h-3 w-14 rounded animate-pulse ${isDark ? 'bg-slate-700/60' : 'bg-slate-300'}`} />
        </div>
      </div>

      {/* Footer Buttons */}
      <div
        className={`p-3 border-t flex items-center justify-between gap-2 ${
          isDark ? 'bg-slate-950/30 border-slate-800/50' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <button
          disabled
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed ${
            isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Catch-Up</span>
        </button>
        <button
          disabled
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed ${
            isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          <span>Match Summary</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  user,
  onSelectMatch,
  onOpenCatchUp,
  onRefresh,
  isLoading = false,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'RECENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTournament, setSelectedTournament] = useState<string>('All');

  const isDark = user.theme === 'dark';

  const liveMatchesList = matches.filter((m) => {
    if (m.status !== 'LIVE' && m.status !== 'INTERRUPTED') return false;
    if (selectedTournament !== 'All' && !m.tournament.toLowerCase().includes(selectedTournament.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.teamA.name} ${m.teamB.name} ${m.tournament} ${m.venue}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const upcomingMatchesList = matches.filter((m) => {
    if (m.status !== 'UPCOMING') return false;
    if (selectedTournament !== 'All' && !m.tournament.toLowerCase().includes(selectedTournament.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.teamA.name} ${m.teamB.name} ${m.tournament} ${m.venue}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const recentMatchesList = matches.filter((m) => {
    if (m.status !== 'RECENT') return false;
    if (selectedTournament !== 'All' && !m.tournament.toLowerCase().includes(selectedTournament.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.teamA.name} ${m.teamB.name} ${m.tournament} ${m.venue}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const liveCount = matches.filter((m) => m.status === 'LIVE' || m.status === 'INTERRUPTED').length;
  const upcomingCount = matches.filter((m) => m.status === 'UPCOMING').length;
  const recentCount = matches.filter((m) => m.status === 'RECENT').length;

  const tournaments = ['All', 'T20 Series', 'ODI Series', 'Test Series'];

  const filteredMatches = matches.filter((m) => {
    // Status filter
    if (filter === 'LIVE' && m.status !== 'LIVE' && m.status !== 'INTERRUPTED') return false;
    if (filter === 'UPCOMING' && m.status !== 'UPCOMING') return false;
    if (filter === 'RECENT' && m.status !== 'RECENT') return false;

    // Tournament filter
    if (selectedTournament !== 'All' && !m.tournament.toLowerCase().includes(selectedTournament.toLowerCase())) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.teamA.name} ${m.teamB.name} ${m.tournament} ${m.venue}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-xs font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
            <Radio className="w-4 h-4" />
            <span>MATCH CENTER & LIVE TELEMETRY</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Cricket Fixtures & Scores</h1>
        </div>

        <div className={`flex items-center gap-2 font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Real-time ball feed active</span>
        </div>
      </div>

      {/* Real-time Search Grounding Sync State (when awaiting matches or refreshing) */}
      {matches.length === 0 && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            isDark
              ? 'bg-cyan-950/30 border-cyan-500/20 text-cyan-300'
              : 'bg-cyan-50 border-cyan-200 text-cyan-950 font-medium'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 shrink-0 text-cyan-500 animate-pulse" />
            <span>
              {isLoading
                ? 'Syncing live cricket fixtures via Gemini + Google Search Grounding...'
                : 'Awaiting verified match fixtures from Gemini Google Search Grounding. Polling every 2 minutes.'}
            </span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-[11px] shrink-0 hover:bg-cyan-400 transition-all ${
                isLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
      )}

      {/* Search & Tournament Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-slate-500' : 'text-slate-600'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams, venues, tournaments..."
            className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
              isDark ? 'bg-[#091b2e] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900 font-medium placeholder-slate-500 shadow-xs'
            }`}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Matches', count: matches.length },
            { id: 'LIVE', label: 'LIVE', count: liveCount, badge: true },
            { id: 'UPCOMING', label: 'Upcoming', count: upcomingCount },
            { id: 'RECENT', label: 'Recent Results', count: recentCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                filter === tab.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : isDark
                  ? 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100 font-bold'
              }`}
            >
              {tab.badge && liveCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              )}
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  filter === tab.id
                    ? 'bg-slate-950/20 text-slate-950 font-bold'
                    : isDark
                    ? 'bg-slate-700/30 text-slate-400'
                    : 'bg-slate-200 text-slate-800 font-extrabold'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tournament Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className={`text-[11px] font-mono flex items-center gap-1 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-700 font-bold'}`}>
            <Filter className="w-3 h-3" /> Filter Series:
          </span>
          {tournaments.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTournament(t)}
              className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-all border whitespace-nowrap ${
                selectedTournament === t
                  ? isDark
                    ? 'bg-slate-800 text-cyan-300 border-cyan-400 font-bold'
                    : 'bg-cyan-600 text-white border-cyan-600 font-bold'
                  : isDark
                  ? 'bg-slate-900/50 text-slate-400 border-slate-800'
                  : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 font-medium'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Search Filtered Empty State */}
      {searchQuery.trim() && filteredMatches.length === 0 ? (
        <div
          className={`p-10 text-center rounded-3xl border space-y-3 ${
            isDark ? 'border-slate-800 bg-slate-900/30 text-white' : 'border-slate-200 bg-white shadow-xs text-slate-900'
          }`}
        >
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="font-bold text-sm">No matches found for &quot;{searchQuery}&quot;</h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Try searching for a different team or tournament keyword.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-cyan-400 transition-all"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* SECTION: LIVE MATCHES */}
          {(filter === 'ALL' || filter === 'LIVE') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-slate-800/40">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Radio className="w-4 h-4 text-red-500" />
                  <span>Live Matches</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      liveMatchesList.length > 0
                        ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                        : isDark
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {liveMatchesList.length}
                  </span>
                </h2>
              </div>

              {liveMatchesList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {liveMatchesList.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isDark={isDark}
                      onSelectMatch={onSelectMatch}
                      onOpenCatchUp={onOpenCatchUp}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <LiveMatchCardSkeleton isDark={isDark} />
                  <LiveMatchCardSkeleton isDark={isDark} />
                </div>
              )}
            </div>
          )}

          {/* SECTION: UPCOMING MATCHES */}
          {(filter === 'ALL' || filter === 'UPCOMING') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-slate-800/40">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Upcoming Matches</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      upcomingMatchesList.length > 0
                        ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                        : isDark
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {upcomingMatchesList.length}
                  </span>
                </h2>
              </div>

              {upcomingMatchesList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {upcomingMatchesList.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isDark={isDark}
                      onSelectMatch={onSelectMatch}
                      onOpenCatchUp={onOpenCatchUp}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <UpcomingMatchCardSkeleton isDark={isDark} />
                  <UpcomingMatchCardSkeleton isDark={isDark} />
                  <UpcomingMatchCardSkeleton isDark={isDark} />
                </div>
              )}
            </div>
          )}

          {/* SECTION: RECENT RESULTS */}
          {(filter === 'ALL' || filter === 'RECENT') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-slate-800/40">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Recent Results</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      recentMatchesList.length > 0
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                        : isDark
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {recentMatchesList.length}
                  </span>
                </h2>
              </div>

              {recentMatchesList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {recentMatchesList.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isDark={isDark}
                      onSelectMatch={onSelectMatch}
                      onOpenCatchUp={onOpenCatchUp}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <RecentResultCardSkeleton isDark={isDark} />
                  <RecentResultCardSkeleton isDark={isDark} />
                  <RecentResultCardSkeleton isDark={isDark} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
