import React, { useState } from 'react';
import {
  Radio,
  Bell,
  ChevronRight,
  Flame,
  Clock,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { MatchData, NewsArticle, UserProfile } from '../types';
import { TeamLogo } from './TeamLogo';

interface HomeViewProps {
  matches: MatchData[];
  news: NewsArticle[];
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  onSelectMatch: (match: MatchData) => void;
  onOpenCatchUp: (match: MatchData) => void;
  onSelectNews: (article: NewsArticle) => void;
  onNavigateTab: (tab: 'home' | 'matches' | 'alerts' | 'news' | 'profile') => void;
  isLoading?: boolean;
}

const LiveMatchSpotlightSkeleton: React.FC<{
  isDark: boolean;
  onNavigateTab: (tab: 'home' | 'matches' | 'alerts' | 'news' | 'profile') => void;
}> = ({ isDark, onNavigateTab }) => {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        isDark
          ? 'bg-[#091b2e] border-slate-800 text-white shadow-lg shadow-black/20'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Header: Tournament/Series Name & Match Status Skeleton */}
      <div
        className={`px-4 py-2.5 border-b flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`h-3.5 w-36 sm:w-48 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <span className={`text-[10px] font-mono hidden sm:inline ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            • Tournament Series
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono uppercase flex items-center gap-1.5 ${
              isDark
                ? 'bg-slate-800/80 text-cyan-400 border-cyan-500/30'
                : 'bg-cyan-50 text-cyan-700 border-cyan-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            STANDBY
          </span>
        </div>
      </div>

      {/* Compact Scoreboard Grid */}
      <div className="p-3.5 sm:p-4 space-y-3">
        {/* Team A Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Team logo skeleton */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shrink-0 animate-pulse ${
                isDark ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-slate-200 text-slate-400 border border-slate-300'
              }`}
            >
              T1
            </div>
            {/* Team name & abbreviation */}
            <div className="space-y-1.5 min-w-0">
              <div className={`h-4 w-28 sm:w-36 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className={`h-3 w-12 rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/70'}`} />
            </div>
          </div>
          {/* Score & overs */}
          <div className="text-right shrink-0 pl-2 space-y-1.5">
            <div className={`h-5 w-16 ml-auto rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div className={`h-3 w-12 ml-auto rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/70'}`} />
          </div>
        </div>

        {/* Team B Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Team logo skeleton */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shrink-0 animate-pulse ${
                isDark ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-slate-200 text-slate-400 border border-slate-300'
              }`}
            >
              T2
            </div>
            {/* Team name & abbreviation */}
            <div className="space-y-1.5 min-w-0">
              <div className={`h-4 w-28 sm:w-36 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className={`h-3 w-12 rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/70'}`} />
            </div>
          </div>
          {/* Score & overs */}
          <div className="text-right shrink-0 pl-2 space-y-1.5">
            <div className={`h-5 w-16 ml-auto rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div className={`h-3 w-12 ml-auto rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/70'}`} />
          </div>
        </div>

        {/* Match Situation & Run Rate Bar */}
        <div
          className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 ${
            isDark
              ? 'bg-slate-800/40 border border-slate-700/40'
              : 'bg-slate-100/80 border border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDark ? 'bg-cyan-400' : 'bg-cyan-600'} animate-pulse`} />
            <div className={`h-3 w-40 sm:w-60 rounded animate-pulse ${isDark ? 'bg-slate-700/60' : 'bg-slate-300'}`} />
          </div>
          <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500 font-bold'}>CRR</span>
            <div className={`h-3 w-8 rounded animate-pulse ${isDark ? 'bg-slate-700/60' : 'bg-slate-300'}`} />
          </div>
        </div>
      </div>

      {/* Action CTAs */}
      <div
        className={`px-3.5 py-2.5 border-t flex items-center gap-2 ${
          isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50/80 border-slate-200'
        }`}
      >
        <button
          disabled
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 opacity-60 cursor-not-allowed ${
            isDark
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-cyan-500" />
          <span>Match Brief</span>
        </button>
        <button
          onClick={() => onNavigateTab('matches')}
          className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1 shadow-xs transition-all"
        >
          <span>Open Match Center</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const UpcomingMatchPreviewSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <div
      className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
        isDark ? 'bg-slate-800/30 border-slate-700/40' : 'bg-slate-50 border-slate-200 shadow-2xs'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Team logo skeleton */}
        <div className="flex items-center -space-x-1.5 shrink-0">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[8px] font-bold border animate-pulse ${
              isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-200 text-slate-400 border-slate-300'
            }`}
          >
            T1
          </div>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[8px] font-bold border animate-pulse ${
              isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-200 text-slate-400 border-slate-300'
            }`}
          >
            T2
          </div>
        </div>

        <div className="space-y-1 min-w-0 truncate">
          {/* Team names & VS indicator */}
          <div className="flex items-center gap-1.5">
            <div className={`h-3.5 w-12 sm:w-16 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <span className={`text-[10px] font-mono font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>vs</span>
            <div className={`h-3.5 w-12 sm:w-16 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          </div>
          {/* Competition & Venue skeleton */}
          <div className="flex items-center gap-1.5">
            <div className={`h-2.5 w-16 sm:w-20 rounded animate-pulse ${isDark ? 'bg-slate-800/70' : 'bg-slate-200/80'}`} />
            <span className={`text-[9px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>•</span>
            <div className={`h-2.5 w-14 sm:w-18 rounded animate-pulse ${isDark ? 'bg-slate-800/70' : 'bg-slate-200/80'}`} />
          </div>
        </div>
      </div>

      {/* Date / time skeleton */}
      <div className="text-right shrink-0 ml-2 space-y-1">
        <div className={`h-4 w-16 rounded-md animate-pulse ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`} />
        <div className={`h-2.5 w-12 ml-auto rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200'}`} />
      </div>
    </div>
  );
};

const RecentResultPreviewSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <div
      className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
        isDark ? 'bg-slate-800/30 border-slate-700/40' : 'bg-slate-50 border-slate-200 shadow-2xs'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Team logo skeleton */}
        <div className="flex items-center -space-x-1.5 shrink-0">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[8px] font-bold border animate-pulse ${
              isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-200 text-slate-400 border-slate-300'
            }`}
          >
            T1
          </div>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[8px] font-bold border animate-pulse ${
              isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-200 text-slate-400 border-slate-300'
            }`}
          >
            T2
          </div>
        </div>

        <div className="space-y-1 min-w-0 truncate">
          {/* Team names */}
          <div className="flex items-center gap-1.5">
            <div className={`h-3.5 w-12 sm:w-16 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <span className={`text-[10px] font-mono font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>vs</span>
            <div className={`h-3.5 w-12 sm:w-16 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          </div>
          {/* Competition & Result status skeleton */}
          <div className="flex items-center gap-1.5">
            <div className={`h-2.5 w-16 sm:w-20 rounded animate-pulse ${isDark ? 'bg-slate-800/70' : 'bg-slate-200/80'}`} />
            <span className={`text-[9px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>•</span>
            <div className={`h-2.5 w-14 sm:w-18 rounded animate-pulse ${isDark ? 'bg-slate-800/70' : 'bg-slate-200/80'}`} />
          </div>
        </div>
      </div>

      {/* Score skeleton & Date skeleton */}
      <div className="text-right shrink-0 ml-2 space-y-1">
        <div className={`h-4 w-14 ml-auto rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className={`h-2.5 w-10 ml-auto rounded animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-200'}`} />
      </div>
    </div>
  );
};

export const HomeView: React.FC<HomeViewProps> = ({
  matches,
  news,
  user,
  onSelectMatch,
  onOpenCatchUp,
  onSelectNews,
  onNavigateTab,
  isLoading = false,
}) => {
  const [alertFeedback] = useState<string | null>(null);

  const isDark = user.theme === 'dark';

  // Determine time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 👋';
    if (hour < 18) return 'Good afternoon 👋';
    return 'Good evening 👋';
  };

  // Extract concise match sets
  const liveMatches = matches.filter((m) => m.status === 'LIVE' || m.status === 'INTERRUPTED');
  const upcomingMatches = matches.filter((m) => m.status === 'UPCOMING').slice(0, 2);
  const recentMatches = matches.filter((m) => m.status === 'RECENT').slice(0, 2);

  const featuredLiveMatch = liveMatches[0] || matches[0];

  // Render Skeleton Loading State
  if (isLoading) {
    return (
      <div className="space-y-5 pb-24 max-w-5xl mx-auto animate-pulse">
        {/* Hero Skeleton */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border flex justify-between items-center ${
            isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-slate-200 border-slate-300'
          } h-28`}
        >
          <div className="space-y-2 w-1/2">
            <div className={`h-3 w-28 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
            <div className={`h-6 w-48 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
            <div className={`h-3 w-60 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
          </div>
          <div className={`h-9 w-36 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
        </div>

        {/* Live Spotlight Skeleton */}
        <div className="space-y-2">
          <div className={`h-5 w-40 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <div className="flex justify-between">
              <div className={`h-3 w-32 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
              <div className={`h-4 w-16 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
            </div>
            <div className="space-y-2 py-1">
              <div className={`h-5 w-full rounded ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
              <div className={`h-5 w-full rounded ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
            </div>
            <div className={`h-7 w-full rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
          </div>
        </div>

        {/* Grid Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-3xl border h-36 ${
              isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          />
          <div
            className={`p-4 rounded-3xl border h-36 ${
              isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24 max-w-5xl mx-auto">
      {/* Toast Feedback */}
      {alertFeedback && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 border border-cyan-300 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{alertFeedback}</span>
        </div>
      )}

      {/* Simplified Consumer-Friendly Hero Banner */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-r from-[#091b2e] via-[#0b2238] to-[#071728] border-slate-800'
            : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700 shadow-sm'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE COVERAGE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {getGreeting()}
          </h1>
          <p className="text-xs text-slate-300 font-medium">
            Stay updated without watching every ball.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('matches')}
          className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all shrink-0"
        >
          <span>Browse All Fixtures</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* SECTION 1: COMPACT LIVE MATCH SPOTLIGHT */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
            <Radio className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
            <span>Live Match Spotlight</span>
          </h2>
          <button
            onClick={() => onNavigateTab('matches')}
            className={`text-xs font-mono font-bold hover:underline flex items-center gap-1 ${
              isDark ? 'text-cyan-400' : 'text-cyan-700 font-bold'
            }`}
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {featuredLiveMatch ? (
          <div
            className={`rounded-2xl border transition-all duration-200 hover:border-cyan-500/50 ${
              isDark
                ? 'bg-[#091b2e] border-slate-800 text-white shadow-lg shadow-black/20'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            {/* Header: Tournament & Status */}
            <div
              className={`px-4 py-2.5 border-b flex items-center justify-between text-xs ${
                isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span
                className={`font-semibold truncate max-w-[280px] sm:max-w-md ${
                  isDark ? 'text-slate-300' : 'text-slate-700 font-bold'
                }`}
              >
                {featuredLiveMatch.tournament}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 font-mono uppercase shrink-0 ${
                  featuredLiveMatch.status === 'LIVE'
                    ? 'bg-red-500/15 text-red-500 border-red-500/30'
                    : featuredLiveMatch.status === 'INTERRUPTED'
                    ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                    : 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30'
                }`}
              >
                {featuredLiveMatch.status === 'LIVE' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                )}
                {featuredLiveMatch.status === 'INTERRUPTED' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
                {featuredLiveMatch.status}
              </span>
            </div>

            {/* Compact Scoreboard Grid */}
            <div
              className="p-3.5 sm:p-4 cursor-pointer space-y-2.5"
              onClick={() => onSelectMatch(featuredLiveMatch)}
            >
              {/* Team A Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <TeamLogo
                    logo={featuredLiveMatch.teamA.logo}
                    name={featuredLiveMatch.teamA.name}
                    shortName={featuredLiveMatch.teamA.shortName}
                    size="sm"
                  />
                  <div className="truncate">
                    <span className="font-bold text-sm text-slate-900 dark:text-white mr-2">
                      {featuredLiveMatch.teamA.name}
                    </span>
                    <span
                      className={`text-xs font-mono ${
                        isDark ? 'text-slate-400' : 'text-slate-500 font-medium'
                      }`}
                    >
                      ({featuredLiveMatch.teamA.shortName})
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className="text-base sm:text-lg font-mono font-black tracking-tight">
                    {featuredLiveMatch.teamA.score}
                  </span>
                  {featuredLiveMatch.teamA.overs && (
                    <span
                      className={`ml-1.5 text-xs font-mono ${
                        isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'
                      }`}
                    >
                      ({featuredLiveMatch.teamA.overs} ov)
                    </span>
                  )}
                </div>
              </div>

              {/* Team B Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <TeamLogo
                    logo={featuredLiveMatch.teamB.logo}
                    name={featuredLiveMatch.teamB.name}
                    shortName={featuredLiveMatch.teamB.shortName}
                    size="sm"
                  />
                  <div className="truncate">
                    <span className="font-bold text-sm text-slate-900 dark:text-white mr-2">
                      {featuredLiveMatch.teamB.name}
                    </span>
                    <span
                      className={`text-xs font-mono ${
                        isDark ? 'text-slate-400' : 'text-slate-500 font-medium'
                      }`}
                    >
                      ({featuredLiveMatch.teamB.shortName})
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className="text-base sm:text-lg font-mono font-black tracking-tight">
                    {featuredLiveMatch.teamB.score || '-'}
                  </span>
                  {featuredLiveMatch.teamB.overs && (
                    <span
                      className={`ml-1.5 text-xs font-mono ${
                        isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'
                      }`}
                    >
                      ({featuredLiveMatch.teamB.overs} ov)
                    </span>
                  )}
                </div>
              </div>

              {/* Match Situation Bar */}
              {featuredLiveMatch.statusText && (
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
                    isDark
                      ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/20'
                      : 'bg-cyan-50 text-cyan-950 border border-cyan-200 font-bold'
                  }`}
                >
                  <span className="truncate">{featuredLiveMatch.statusText}</span>
                  {featuredLiveMatch.crr && (
                    <span
                      className={`font-mono text-[11px] shrink-0 ${
                        isDark ? 'text-cyan-400' : 'text-cyan-800 font-extrabold'
                      }`}
                    >
                      CRR: {featuredLiveMatch.crr}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Compact Action CTAs */}
            <div
              className={`px-3.5 py-2.5 border-t flex items-center gap-2 ${
                isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              <button
                onClick={() => onOpenCatchUp(featuredLiveMatch)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  isDark
                    ? 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30'
                    : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-950 border border-cyan-300 font-extrabold shadow-2xs'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-cyan-500" />
                <span>Match Brief</span>
              </button>
              <button
                onClick={() => onSelectMatch(featuredLiveMatch)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1 shadow-xs transition-all"
              >
                <span>Open Match Center</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <LiveMatchSpotlightSkeleton isDark={isDark} onNavigateTab={onNavigateTab} />
        ) : (
          <div
            className={`p-5 rounded-2xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-[#091b2e] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <span>No live or featured fixtures returned right now from Sportmonks Cricket API.</span>
            <button
              onClick={() => onNavigateTab('matches')}
              className="text-cyan-500 font-bold hover:underline shrink-0 ml-3"
            >
              Open Fixtures &rarr;
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: SMALL UPCOMING & RECENT PREVIEWS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Matches Preview */}
        <div
          className={`p-4 rounded-3xl border space-y-3 ${
            isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div
            className={`flex items-center justify-between border-b pb-2 ${
              isDark ? 'border-slate-800/60' : 'border-slate-200'
            }`}
          >
            <h3
              className={`text-xs font-mono font-bold uppercase flex items-center gap-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Upcoming Matches</span>
            </h3>
            <button
              onClick={() => onNavigateTab('matches')}
              className={`text-[11px] font-bold hover:underline ${
                isDark ? 'text-cyan-400' : 'text-cyan-700'
              }`}
            >
              See All &rarr;
            </button>
          </div>

          {upcomingMatches.length > 0 ? (
            <div className="space-y-2">
              {upcomingMatches.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onSelectMatch(m)}
                  className={`p-2.5 sm:p-3 rounded-2xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                    isDark
                      ? 'bg-slate-800/30 border-slate-700/40 hover:border-cyan-400/50'
                      : 'bg-slate-50 border-slate-200 hover:border-cyan-500/50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center -space-x-1.5 shrink-0">
                      <TeamLogo logo={m.teamA.logo} name={m.teamA.name} shortName={m.teamA.shortName} size="xs" />
                      <TeamLogo logo={m.teamB.logo} name={m.teamB.name} shortName={m.teamB.shortName} size="xs" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold truncate">
                        {m.teamA.shortName} vs {m.teamB.shortName}
                      </p>
                      <p
                        className={`text-[10px] truncate ${
                          isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
                        }`}
                      >
                        {m.tournament}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-600 font-mono font-bold text-[10px] border border-blue-200/50 shrink-0 ml-2">
                    Scheduled
                  </span>
                </div>
              ))}
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              <UpcomingMatchPreviewSkeleton isDark={isDark} />
              <UpcomingMatchPreviewSkeleton isDark={isDark} />
              <UpcomingMatchPreviewSkeleton isDark={isDark} />
            </div>
          ) : (
            <p className={`text-xs py-4 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              No upcoming fixtures scheduled in the current feed window.
            </p>
          )}
        </div>

        {/* Recent Matches Preview */}
        <div
          className={`p-4 rounded-3xl border space-y-3 ${
            isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div
            className={`flex items-center justify-between border-b pb-2 ${
              isDark ? 'border-slate-800/60' : 'border-slate-200'
            }`}
          >
            <h3
              className={`text-xs font-mono font-bold uppercase flex items-center gap-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Recent Results</span>
            </h3>
            <button
              onClick={() => onNavigateTab('matches')}
              className={`text-[11px] font-bold hover:underline ${
                isDark ? 'text-cyan-400' : 'text-cyan-700'
              }`}
            >
              See All &rarr;
            </button>
          </div>

          {recentMatches.length > 0 ? (
            <div className="space-y-2">
              {recentMatches.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onSelectMatch(m)}
                  className={`p-2.5 sm:p-3 rounded-2xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                    isDark
                      ? 'bg-slate-800/30 border-slate-700/40 hover:border-cyan-400/50'
                      : 'bg-slate-50 border-slate-200 hover:border-cyan-500/50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center -space-x-1.5 shrink-0">
                      <TeamLogo logo={m.teamA.logo} name={m.teamA.name} shortName={m.teamA.shortName} size="xs" />
                      <TeamLogo logo={m.teamB.logo} name={m.teamB.name} shortName={m.teamB.shortName} size="xs" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold truncate">
                        {m.teamA.shortName} vs {m.teamB.shortName}
                      </p>
                      <p
                        className={`text-[10px] truncate ${
                          isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
                        }`}
                      >
                        {m.statusText}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-mono font-extrabold text-[11px] shrink-0 ml-2 ${
                      isDark ? 'text-cyan-400' : 'text-cyan-800'
                    }`}
                  >
                    {m.teamA.score}
                  </span>
                </div>
              ))}
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              <RecentResultPreviewSkeleton isDark={isDark} />
              <RecentResultPreviewSkeleton isDark={isDark} />
              <RecentResultPreviewSkeleton isDark={isDark} />
            </div>
          ) : (
            <p className={`text-xs py-4 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              No completed match results in the current feed window.
            </p>
          )}
        </div>
      </div>

      {/* SECTION 3: COMPACT PERSONALIZED ALERT CARD */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-r from-amber-950/20 via-slate-900 to-amber-950/20 border-amber-500/30'
            : 'bg-amber-50/90 border-amber-300 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 border border-amber-500/30 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">Smart Alert Engine</h3>
              {user?.preferences?.preset && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-extrabold rounded bg-amber-500/20 text-amber-800 uppercase">
                  Preset: {user.preferences.preset}
                </span>
              )}
            </div>
            <p
              className={`text-xs mt-0.5 ${
                isDark ? 'text-slate-400' : 'text-slate-700 font-medium'
              }`}
            >
              Busy Mode is {user?.preferences?.busyMode ? 'ON (Hourly Digests)' : 'OFF'}. Real-time notifications active.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('alerts')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10 shrink-0"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Manage Alert Rules</span>
        </button>
      </div>

      {/* SECTION 4: COMPACT NEWS PREVIEW */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Top Headline</span>
          </h2>
          <button
            onClick={() => onNavigateTab('news')}
            className={`text-xs font-mono font-bold hover:underline flex items-center gap-1 ${
              isDark ? 'text-cyan-400' : 'text-cyan-700 font-bold'
            }`}
          >
            <span>Read Full Feed</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {news[0] ? (
          <div
            onClick={() => onSelectNews(news[0])}
            className={`p-4 rounded-3xl border cursor-pointer transition-all hover:border-cyan-500/50 flex flex-col sm:flex-row gap-4 ${
              isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <img
              src={news[0].imageUrl || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80'}
              alt={news[0].title}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80';
              }}
              className="w-full sm:w-36 h-28 rounded-2xl object-cover shrink-0 bg-slate-800"
            />
            <div className="flex flex-col justify-between">
              <div>
                <span
                  className={`text-[10px] font-mono font-bold uppercase ${
                    isDark ? 'text-cyan-400' : 'text-cyan-700 font-extrabold'
                  }`}
                >
                  {news[0].category} • {news[0].source}
                </span>
                <h4 className="text-sm sm:text-base font-bold mt-1 leading-snug line-clamp-2">
                  {news[0].title}
                </h4>
                <p
                  className={`text-xs line-clamp-2 mt-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
                  }`}
                >
                  {news[0].summary}
                </p>
              </div>
              <div
                className={`flex items-center gap-3 text-[11px] font-mono mt-3 ${
                  isDark ? 'text-slate-500' : 'text-slate-600 font-semibold'
                }`}
              >
                <span>{news[0].timeAgo}</span>
                <span>•</span>
                <span>{news[0].readTime}</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`p-6 rounded-2xl border text-center text-xs ${
              isDark ? 'bg-[#091b2e] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-xs'
            }`}
          >
            No news updates available at this time.
          </div>
        )}
      </div>
    </div>
  );
};

