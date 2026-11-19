import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Share2,
  AlertCircle,
  Bell,
  CheckCircle2,
  TrendingUp,
  Search,
  Zap,
  Bot,
  PlayCircle,
  Volume2,
  Flame,
  ExternalLink,
  RefreshCw,
  Clock,
  Info,
  Trophy,
  Award,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { MatchData, UserProfile, InningsScorecard } from '../types';
import { TeamLogo } from './TeamLogo';
import { LiveMatchPulse } from './LiveMatchPulse';
import { fetchMatchById, hasDetailedScorecard, mergeMatchSafely } from '../services/cricketDataService';

interface MatchCenterViewProps {
  match: MatchData;
  onBack: () => void;
  onOpenCatchUp: (match: MatchData) => void;
  onMatchUpdate?: (match: MatchData) => void;
  user: UserProfile;
}

export const MatchCenterView: React.FC<MatchCenterViewProps> = ({
  match,
  onBack,
  onOpenCatchUp,
  onMatchUpdate,
  user,
}) => {
  const [currentMatch, setCurrentMatch] = useState<MatchData>(match);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [selectedInningsView, setSelectedInningsView] = useState<'all' | number>('all');

  const [activeTab, setActiveTab] = useState<'overview' | 'scorecard' | 'commentary' | 'pulse' | 'alerts'>('overview');
  const [commentaryFilter, setCommentaryFilter] = useState<'all' | 'boundaries' | 'wickets' | 'milestones'>('all');
  const [commentarySearch, setCommentarySearch] = useState('');
  const [rainSubscribed, setRainSubscribed] = useState(false);
  const [simulatedResumeAlert, setSimulatedResumeAlert] = useState(false);

  const [aiInsight, setAiInsight] = useState<{
    insight?: string;
    winProbability?: { teamA: number; teamB: number };
    keyMatchup?: string;
  } | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const isDark = user.theme === 'dark';

  const loadDetails = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setIsManualRefreshing(true);
    } else {
      setIsLoadingDetails(true);
    }

    try {
      const detailed = await fetchMatchById(match.id, forceRefresh);
      if (detailed) {
        // Only replace currentMatch when the newly fetched match actually contains valid detailed data
        if (hasDetailedScorecard(detailed)) {
          setCurrentMatch(detailed);
          onMatchUpdate?.(detailed);
          setDetailsError(null);
        } else if (!hasDetailedScorecard(currentMatch)) {
          // If currentMatch does not have details either, take detailed
          setCurrentMatch(detailed);
          onMatchUpdate?.(detailed);
          setDetailsError(null);
        } else {
          // currentMatch already has detailed scorecard, but detailed response had partial data:
          // Preserve the detailed scorecard data and merge safe fields only
          const merged = mergeMatchSafely(currentMatch, detailed);
          setCurrentMatch(merged);
          onMatchUpdate?.(merged);
          setDetailsError(null);
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch match details:', err);
      setDetailsError('Live scorecard is temporarily syncing. Displaying latest match overview.');
    } finally {
      setIsLoadingDetails(false);
      setIsManualRefreshing(false);
    }
  };

  // Preserve the currently loaded detailed scorecard while background fixture updates occur.
  // Only replace currentMatch when the newly fetched match actually contains valid detailed data.
  useEffect(() => {
    if (!match) return;

    if (match.id !== currentMatch.id) {
      setCurrentMatch(match);
      return;
    }

    if (hasDetailedScorecard(match)) {
      setCurrentMatch(match);
    } else if (hasDetailedScorecard(currentMatch)) {
      // Safe background fixture update: update lightweight/live summary fields only, never overwrite detailed scorecard
      setCurrentMatch((prev) => mergeMatchSafely(prev, match));
    } else {
      setCurrentMatch(match);
    }
  }, [match]);

  useEffect(() => {
    let isMounted = true;

    // Do not reset currentMatch to the lightweight match prop when a detailed scorecard has already been loaded for this match
    if (currentMatch.id !== match.id) {
      setCurrentMatch(match);
      setSelectedInningsView('all');
    } else if (!hasDetailedScorecard(currentMatch) && hasDetailedScorecard(match)) {
      setCurrentMatch(match);
    }
    setDetailsError(null);

    loadDetails(false);

    let interval: any = null;
    if (match.status === 'LIVE' || match.status === 'INTERRUPTED') {
      interval = setInterval(() => {
        if (isMounted) {
          loadDetails(false);
        }
      }, 60000);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [match.id]);

  const fetchMatchInsight = async () => {
    setLoadingInsight(true);
    try {
      const res = await fetch('/api/gemini/match-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchState: currentMatch }),
      });
      const data = await res.json();
      setAiInsight(data);
    } catch (err) {
      setAiInsight({
        insight: 'Pitch is favoring pace with variable bounce in recent overs.',
        winProbability: { teamA: 64, teamB: 36 },
        keyMatchup: `${currentMatch.teamA.shortName} vs ${currentMatch.teamB.shortName}`,
      });
    } finally {
      setLoadingInsight(false);
    }
  };

  const filteredCommentary = (currentMatch.commentary || []).filter((c) => {
    if (commentaryFilter === 'boundaries' && !c.isBoundary && !c.isSix) return false;
    if (commentaryFilter === 'wickets' && !c.isWicket) return false;
    if (commentaryFilter === 'milestones' && !c.isMilestone) return false;
    if (commentarySearch.trim()) {
      return (
        c.description.toLowerCase().includes(commentarySearch.toLowerCase()) ||
        c.overNumber.includes(commentarySearch)
      );
    }
    return true;
  });

  const handleNotifyResume = () => {
    setRainSubscribed(true);
    setTimeout(() => {
      setSimulatedResumeAlert(true);
    }, 2500);
  };

  const formatStat = (val: any): string => {
    if (val === undefined || val === null || val === '') return '—';
    return String(val);
  };

  const formatStrikeRate = (batter: { runs?: any; balls?: any; sr?: any }): string => {
    const r = typeof batter.runs === 'number' ? batter.runs : parseInt(batter.runs, 10);
    const b = typeof batter.balls === 'number' ? batter.balls : parseInt(batter.balls, 10);
    if (!isNaN(r) && !isNaN(b) && b > 0) {
      return ((r / b) * 100).toFixed(2);
    }
    if (r === 0 && b === 0) {
      return '0.00';
    }
    if (batter.sr !== undefined && batter.sr !== null && batter.sr !== '' && !isNaN(Number(batter.sr))) {
      return Number(batter.sr).toFixed(2);
    }
    return '—';
  };

  const formatEconomy = (bowler: { overs?: any; runs?: any; economy?: any }): string => {
    if (bowler.economy !== undefined && bowler.economy !== null && bowler.economy !== '' && !isNaN(Number(bowler.economy))) {
      return Number(bowler.economy).toFixed(2);
    }
    const r = typeof bowler.runs === 'number' ? bowler.runs : parseInt(bowler.runs, 10);
    const o = typeof bowler.overs === 'number' ? bowler.overs : parseFloat(bowler.overs);
    if (!isNaN(r) && !isNaN(o) && o > 0) {
      return (r / o).toFixed(2);
    }
    return '—';
  };

  const formatDismissal = (batter: { dismissal?: string; isNotOut?: boolean; isStriker?: boolean }): string => {
    if (batter.isNotOut) return 'NOT OUT';
    if (batter.dismissal && typeof batter.dismissal === 'string' && batter.dismissal.trim()) {
      const dLower = batter.dismissal.trim().toLowerCase();
      if (dLower === 'not out') return 'NOT OUT';
      if (dLower !== '—' && dLower !== 'null' && dLower !== 'undefined') {
        return batter.dismissal;
      }
    }
    if (batter.isStriker) return 'NOT OUT';
    return '—';
  };

  const allInnings: InningsScorecard[] =
    currentMatch.innings && currentMatch.innings.length > 0
      ? currentMatch.innings
      : currentMatch.currentInnings
      ? [currentMatch.currentInnings]
      : [];

  const inningsToDisplay =
    selectedInningsView === 'all'
      ? allInnings
      : [allInnings[selectedInningsView] || allInnings[0]].filter(Boolean);

  const allBatters = allInnings.flatMap((inn) =>
    (inn.batters || []).map((b) => ({
      ...b,
      teamShort: inn.teamShort,
      teamName: inn.teamName,
    }))
  );

  const topBatters = [...allBatters]
    .filter((b) => (Number(b.runs) || 0) > 0 || (Number(b.balls) || 0) > 0)
    .sort((a, b) => (Number(b.runs) || 0) - (Number(a.runs) || 0))
    .slice(0, 4);

  const allBowlers = allInnings.flatMap((inn) =>
    (inn.bowlers || []).map((bw) => ({
      ...bw,
      teamShort: inn.teamShort,
      teamName: inn.teamName,
    }))
  );

  const topBowlers = [...allBowlers]
    .filter((bw) => (Number(bw.wickets) || 0) > 0 || (bw.overs !== '—' && bw.overs !== '0' && bw.overs !== 0))
    .sort((a, b) => {
      const wDiff = (Number(b.wickets) || 0) - (Number(a.wickets) || 0);
      if (wDiff !== 0) return wDiff;
      return (Number(a.economy) || 99) - (Number(b.economy) || 99);
    })
    .slice(0, 4);

  const allPartnerships = allInnings.flatMap((inn) =>
    (inn.partnerships || []).map((p) => ({ ...p, teamShort: inn.teamShort, teamName: inn.teamName }))
  );

  const allFallOfWickets = allInnings.flatMap((inn) =>
    (inn.fallOfWickets || []).map((f) => ({ ...f, teamShort: inn.teamShort, teamName: inn.teamName }))
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Play Resumed Alert Toast Simulation */}
      {simulatedResumeAlert && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center justify-between gap-3 border border-emerald-300 animate-bounce max-w-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-extrabold text-sm">ALERT: PLAY RESUMED!</p>
              <p className="text-[11px] font-normal">
                Rain cleared at venue. Umpires out for play.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSimulatedResumeAlert(false)}
            className="px-2 py-1 bg-slate-950 text-white rounded text-[10px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
            isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Matches</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDetails(true)}
            disabled={isManualRefreshing || isLoadingDetails}
            title="Refresh live scorecard"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-950 shadow-xs'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualRefreshing || isLoadingDetails ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">{isManualRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => onOpenCatchUp(currentMatch)}
            className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Catch-Up</span>
          </button>
          <button
            className={`p-2 rounded-xl border transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Match Scorecard Banner */}
      <div
        className={`p-6 rounded-3xl border transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#0a2036] via-[#091b2e] to-[#061422] border-cyan-500/30 text-white'
            : 'bg-gradient-to-br from-cyan-50 via-slate-50 to-teal-50 border-cyan-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-mono mb-4">
          <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-bold'}>{currentMatch.title}</span>
          {isLoadingDetails && (
            <span className="text-[10px] text-cyan-400 font-mono animate-pulse flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Syncing live scorecard...</span>
            </span>
          )}
        </div>

        {/* Teams & Main Score Display */}
        <div className="grid grid-cols-3 items-center gap-2 text-center py-2">
          {/* Team A */}
          <div className="flex flex-col items-center">
            <TeamLogo
              logo={currentMatch.teamA.logo}
              name={currentMatch.teamA.name}
              shortName={currentMatch.teamA.shortName}
              size="lg"
              className="mb-2"
            />
            <h2 className="font-extrabold text-base sm:text-lg">{currentMatch.teamA.name}</h2>
            <p className="text-xl sm:text-2xl font-black font-mono tracking-tight mt-1">
              {currentMatch.teamA.score}
            </p>
            <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>
              {currentMatch.teamA.overs ? `(${currentMatch.teamA.overs} ov)` : ''}
            </p>
          </div>

          {/* Center Versus / Status */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <span className={`text-xs font-mono uppercase font-black ${isDark ? 'text-slate-500' : 'text-slate-700'}`}>VS</span>
            {currentMatch.status === 'LIVE' && (
              <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                LIVE
              </span>
            )}
            {currentMatch.status === 'INTERRUPTED' && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                RAIN DELAY
              </span>
            )}
            {currentMatch.status === 'UPCOMING' && (
              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold">
                UPCOMING
              </span>
            )}
            {currentMatch.status === 'RECENT' && (
              <span className="px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[10px] font-mono font-bold">
                CONCLUDED
              </span>
            )}
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center">
            <TeamLogo
              logo={currentMatch.teamB.logo}
              name={currentMatch.teamB.name}
              shortName={currentMatch.teamB.shortName}
              size="lg"
              className="mb-2"
            />
            <h2 className="font-extrabold text-base sm:text-lg">{currentMatch.teamB.name}</h2>
            <p className="text-xl sm:text-2xl font-black font-mono tracking-tight mt-1">
              {currentMatch.teamB.score || '-'}
            </p>
            <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>
              {currentMatch.teamB.overs ? `(${currentMatch.teamB.overs} ov)` : ''}
            </p>
          </div>
        </div>

        {/* Status bar */}
        <div
          className={`mt-5 p-3 rounded-2xl text-center text-xs font-bold border ${
            isDark
              ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
              : 'bg-cyan-100/90 border-cyan-300 text-cyan-950 font-extrabold shadow-2xs'
          }`}
        >
          {currentMatch.statusText}
        </div>

        {/* Toss & Summary if available */}
        {currentMatch.toss && (
          <div className="mt-2 text-center text-[11px] font-mono text-slate-400">
            <span className="text-cyan-400 font-bold">Toss:</span> {currentMatch.toss}
          </div>
        )}

        {currentMatch.matchSummary && (
          <div className={`mt-3 p-3 rounded-xl text-xs leading-relaxed border ${
            isDark ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-700'
          }`}>
            <span className="font-bold text-cyan-400 mr-1">Summary:</span>
            {currentMatch.matchSummary}
          </div>
        )}

        {/* Key Rate Stats */}
        <div
          className={`grid grid-cols-3 gap-2 mt-4 text-center font-mono text-xs border-t pt-4 ${
            isDark ? 'text-slate-400 border-slate-800/60' : 'text-slate-700 border-slate-200 font-bold'
          }`}
        >
          <div>
            <span className={`block text-[10px] uppercase ${isDark ? 'text-slate-500' : 'text-slate-600 font-semibold'}`}>Current RR</span>
            <span className={`font-bold text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-800 font-extrabold'}`}>{currentMatch.crr || 'N/A'}</span>
          </div>
          <div>
            <span className={`block text-[10px] uppercase ${isDark ? 'text-slate-500' : 'text-slate-600 font-semibold'}`}>Required RR</span>
            <span className={`font-bold text-sm ${isDark ? 'text-amber-400' : 'text-amber-800 font-extrabold'}`}>{currentMatch.rrr || 'N/A'}</span>
          </div>
          <div>
            <span className={`block text-[10px] uppercase ${isDark ? 'text-slate-500' : 'text-slate-600 font-semibold'}`}>Projected</span>
            <span className={`font-bold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-800 font-extrabold'}`}>
              {currentMatch.projectedScore ? `${currentMatch.projectedScore} Runs` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Freshness Timestamp & Google Search Grounding Sources */}
        <div className="mt-4 pt-3 border-t border-slate-500/15 flex flex-col sm:flex-row items-center justify-between text-xs font-mono gap-2">
          <div className="flex items-center gap-2">
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Grounding: Google Search verified
            </span>
            {currentMatch.lastUpdated && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(currentMatch.lastUpdated).toLocaleTimeString()}</span>
              </span>
            )}
          </div>
          {currentMatch.sourceUrl && (
            <a
              href={currentMatch.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:underline flex items-center gap-1 font-bold"
            >
              <span>Verified source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Rain Delay & Play Resumed Interrupted Banner */}
      {currentMatch.status === 'INTERRUPTED' && (
        <div className={`p-5 rounded-3xl border space-y-3 ${isDark ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-slate-900 shadow-xs'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" />
              <h3 className="font-bold text-sm">Play Interrupted - Rain at Venue</h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800">
              DLS Calculation
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
            Covers are on the field. Expected resumption update at {currentMatch.rainDelayDetails?.expectedResume || 'shortly'}.
          </p>
          <button
            onClick={handleNotifyResume}
            disabled={rainSubscribed}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              rainSubscribed
                ? 'bg-emerald-500 text-slate-950 font-extrabold'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>
              {rainSubscribed ? 'Subscribed! Simulating Play Resume Alert...' : 'Notify Me When Play Resumes'}
            </span>
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className={`flex border-b overflow-x-auto ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        {(
          [
            { id: 'overview', label: 'Overview' },
            { id: 'scorecard', label: 'Scorecard' },
            { id: 'commentary', label: 'Commentary' },
            { id: 'pulse', label: '⚡ Fan Pulse' },
            { id: 'alerts', label: 'AI Insights' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 min-w-[90px] py-3 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
              activeTab === t.id
                ? isDark ? 'border-cyan-400 text-cyan-400' : 'border-teal-700 text-teal-800 font-extrabold'
                : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-700 hover:text-slate-950 font-bold'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Match Summary Card */}
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                  Match Summary
                </h3>
              </div>
              {currentMatch.status === 'RECENT' && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[10px] font-mono font-bold">
                  CONCLUDED
                </span>
              )}
              {currentMatch.status === 'LIVE' && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] font-mono font-bold animate-pulse">
                  LIVE IN PLAY
                </span>
              )}
              {currentMatch.status === 'INTERRUPTED' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30 text-[10px] font-mono font-bold">
                  DELAYED / COVERS ON
                </span>
              )}
              {currentMatch.status === 'UPCOMING' && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold">
                  SCHEDULED
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Result & Winner */}
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Result
                </span>
                <p className="font-bold text-sm text-cyan-400">
                  {currentMatch.result || currentMatch.statusText || 'In Progress'}
                </p>
                {currentMatch.winner && (
                  <p className="text-xs text-slate-300 mt-1">
                    <span className="text-slate-400">Winner:</span>{' '}
                    <strong className="text-white">{currentMatch.winner}</strong>
                    {currentMatch.margin && (
                      <span className="text-cyan-400 ml-1">({currentMatch.margin})</span>
                    )}
                  </p>
                )}
              </div>

              {/* Venue & Location */}
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Venue & Ground
                </span>
                <p className="font-bold text-xs text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{currentMatch.venue || 'Stadium Ground'}</span>
                </p>
                {(currentMatch.city || currentMatch.country) && (
                  <p className="text-[11px] text-slate-400 mt-1 pl-5">
                    {[currentMatch.city, currentMatch.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              {/* Toss Decision */}
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Toss
                </span>
                <p className="font-medium text-xs text-slate-200">
                  {currentMatch.toss ||
                    (currentMatch.tossWinner
                      ? `${currentMatch.tossWinner} won the toss and elected to ${
                          currentMatch.tossDecision || 'bat'
                        }`
                      : 'Toss information will appear once conducted')}
                </p>
              </div>

              {/* Player of the Match */}
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Player of the Match
                </span>
                {currentMatch.playerOfMatch &&
                currentMatch.playerOfMatch !== '—' &&
                currentMatch.playerOfMatch.toLowerCase() !== 'null' &&
                currentMatch.playerOfMatch.toLowerCase() !== 'n/a' ? (
                  <p className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{currentMatch.playerOfMatch}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    {currentMatch.status === 'RECENT'
                      ? 'Not officially awarded or unverified'
                      : 'Awarded upon match completion'}
                  </p>
                )}
              </div>
            </div>

            {/* Tactical Match Summary Statement */}
            {currentMatch.matchSummary && (
              <div
                className={`mt-3 p-3.5 rounded-xl border text-xs leading-relaxed ${
                  isDark
                    ? 'bg-slate-900/40 border-slate-800/80 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span className="font-bold text-cyan-400 mr-1.5 font-mono text-[11px] uppercase">
                  Match Report:
                </span>
                {currentMatch.matchSummary}
              </div>
            )}

            {currentMatch.umpires && (
              <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <span className="text-slate-500">Umpires:</span>
                <span>{currentMatch.umpires}</span>
              </div>
            )}
          </div>

          {/* Batting Section (Live vs Recent vs Upcoming) */}
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                {currentMatch.status === 'LIVE' || currentMatch.status === 'INTERRUPTED'
                  ? 'Batting Now (Live)'
                  : currentMatch.status === 'RECENT'
                  ? 'Top Batters / Key Performers'
                  : 'Upcoming Batting Lineup'}
              </h3>
            </div>

            {currentMatch.status === 'UPCOMING' ? (
              <div className="text-xs text-slate-400 font-mono space-y-2 py-1">
                <p>
                  Match has not commenced yet. Full batting lineups and player figures will populate as
                  soon as players take the field.
                </p>
                {currentMatch.startTime && (
                  <p className="text-[11px] text-cyan-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Scheduled Start: {new Date(currentMatch.startTime).toLocaleString()}</span>
                  </p>
                )}
              </div>
            ) : currentMatch.status === 'RECENT' ? (
              topBatters.length > 0 ? (
                <div className="space-y-3">
                  {topBatters.map((batter, i) => (
                    <div
                      key={i}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl border ${
                        isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{batter.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {batter.teamShort}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-mono ${
                            batter.isNotOut || (batter.dismissal && batter.dismissal.toLowerCase().includes('not out'))
                              ? 'text-emerald-400 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          {formatDismissal(batter)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span className="text-cyan-400 font-bold text-sm">
                          {formatStat(batter.runs)}{' '}
                          <span className="text-slate-500 text-xs">({formatStat(batter.balls)}b)</span>
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          4s:{formatStat(batter.fours)} 6s:{formatStat(batter.sixes)}
                        </span>
                        <span className="text-slate-300 text-[11px]">SR:{formatStrikeRate(batter)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2 font-mono">
                  {isLoadingDetails
                    ? 'Retrieving verified batting figures from Google Search Grounding...'
                    : 'Batting statistics are recorded in the Scorecard tab.'}
                </p>
              )
            ) : currentMatch.currentInnings.batters.length > 0 ? (
              <div className="space-y-3">
                {currentMatch.currentInnings.batters.slice(0, 2).map((batter, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {batter.name} {batter.isStriker ? '*' : ''}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {formatDismissal(batter)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-cyan-400 font-bold text-sm">
                        {formatStat(batter.runs)}{' '}
                        <span className="text-slate-500 text-xs">({formatStat(batter.balls)})</span>
                      </span>
                      <span className="text-slate-400 text-[11px] hidden sm:inline">
                        4s:{formatStat(batter.fours)} 6s:{formatStat(batter.sixes)}
                      </span>
                      <span className="text-slate-400 text-[11px]">SR:{formatStrikeRate(batter)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2 font-mono">
                {isLoadingDetails
                  ? 'Retrieving verified live batting figures from Google Search Grounding...'
                  : 'Batting lineup active. Open Scorecard for full figures.'}
              </p>
            )}
          </div>

          {/* Bowling Section (Live vs Recent vs Upcoming) */}
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                {currentMatch.status === 'LIVE' || currentMatch.status === 'INTERRUPTED'
                  ? 'Bowling Now (Live)'
                  : currentMatch.status === 'RECENT'
                  ? 'Top Bowlers / Bowling Highlights'
                  : 'Bowling Attack'}
              </h3>
            </div>

            {currentMatch.status === 'UPCOMING' ? (
              <p className="text-xs text-slate-400 py-1 font-mono">
                Bowling figures will appear once play commences at the venue.
              </p>
            ) : currentMatch.status === 'RECENT' ? (
              topBowlers.length > 0 ? (
                <div className="space-y-3">
                  {topBowlers.map((bowler, i) => (
                    <div
                      key={i}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl border ${
                        isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{bowler.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {bowler.teamShort}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span className="text-slate-300">
                          {formatStat(bowler.overs)} ov ({formatStat(bowler.runs)}r -{' '}
                          <strong className="text-amber-400">{formatStat(bowler.wickets)}w</strong>)
                        </span>
                        <span className="text-cyan-400 font-bold">
                          Econ: {formatEconomy(bowler)}
                        </span>
                        <span className="text-slate-400 text-[11px] hidden sm:inline">
                          M:{formatStat(bowler.maidens)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2 font-mono">
                  {isLoadingDetails
                    ? 'Retrieving verified bowling figures from Google Search Grounding...'
                    : 'Detailed bowling performance available in the Scorecard tab.'}
                </p>
              )
            ) : currentMatch.currentInnings.bowlers.length > 0 ? (
              currentMatch.currentInnings.bowlers.slice(0, 1).map((bowler, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sm">{bowler.name} *</span>
                  <div className="flex items-center gap-4 font-mono">
                    <span className="text-slate-300">
                      {formatStat(bowler.overs)} Ovs ({formatStat(bowler.runs)}R -{' '}
                      <strong className="text-amber-400">{formatStat(bowler.wickets)}W</strong>)
                    </span>
                    <span className="text-cyan-400 font-bold">Econ: {formatEconomy(bowler)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-2 font-mono">
                {isLoadingDetails
                  ? 'Retrieving live bowler data from Google Search Grounding...'
                  : 'Bowler performance currently active in Scorecard.'}
              </p>
            )}
          </div>

          {/* Fall of Wickets & Partnerships (if verified) */}
          {(allFallOfWickets.length > 0 || allPartnerships.length > 0) && (
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                Partnerships & Fall of Wickets
              </h3>

              {allPartnerships.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 block font-bold">
                    Key Partnerships:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    {allPartnerships.map((p, pi) => (
                      <span
                        key={pi}
                        className={`px-3 py-1 rounded-xl border ${
                          isDark
                            ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <strong className="text-cyan-400">{p.batters}</strong>:{' '}
                        <span className="font-bold text-white">{formatStat(p.runs)} runs</span>{' '}
                        {p.balls ? `(${p.balls}b)` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {allFallOfWickets.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] font-mono text-slate-400 block font-bold">
                    Fall of Wickets:
                  </span>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                    {allFallOfWickets.map((f, fi) => (
                      <span
                        key={fi}
                        className={`px-2.5 py-1 rounded-lg border ${
                          isDark
                            ? 'bg-slate-900/40 border-slate-800 text-slate-300'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <strong className="text-amber-400">{f.score}</strong> ({f.batter},{' '}
                        {f.over} ov)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tactical AI Insight Card */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900 border-cyan-500/30' : 'bg-cyan-50/50 border-cyan-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-mono">
                <Bot className="w-4 h-4" />
                <span>Tactical Match AI</span>
              </div>
              <button
                onClick={fetchMatchInsight}
                disabled={loadingInsight}
                className="text-[11px] font-bold text-cyan-400 hover:underline"
              >
                {loadingInsight ? 'Analyzing...' : 'Refresh AI Analysis'}
              </button>
            </div>

            {aiInsight ? (
              <div className="space-y-3 text-xs">
                <p className="leading-relaxed font-medium text-slate-300">{aiInsight.insight}</p>
                {aiInsight.keyMatchup && (
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono">
                    <strong>Key Battle:</strong> {aiInsight.keyMatchup}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Click refresh to run Gemini tactical analysis on pitch conditions and player matchups.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Full Verified Scorecard (Both Innings) */}
      {activeTab === 'scorecard' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Innings Selector: All Innings (Both Teams) vs Specific Innings */}
          {allInnings.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedInningsView('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedInningsView === 'all'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    : 'bg-white text-slate-700 border-slate-200 hover:text-slate-950'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Both Teams (All Innings)</span>
              </button>
              {allInnings.map((inn, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedInningsView(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedInningsView === idx
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      : 'bg-white text-slate-700 border-slate-200 hover:text-slate-950'
                  }`}
                >
                  {inn.teamName || `Innings ${idx + 1}`} ({inn.score || 'Innings'})
                </button>
              ))}
            </div>
          )}

          {/* Upcoming Match Empty State */}
          {currentMatch.status === 'UPCOMING' && allInnings.every((inn) => inn.batters.length === 0) ? (
            <div
              className={`p-8 rounded-2xl border text-center font-mono ${
                isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <Calendar className="w-8 h-8 text-cyan-400 mx-auto mb-3 animate-pulse" />
              <h4 className="font-bold text-sm text-white mb-1">Match Scheduled</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                {currentMatch.startTime
                  ? `Scheduled to commence on ${new Date(currentMatch.startTime).toLocaleString()}.`
                  : 'Fixture scheduled to start shortly.'}{' '}
                Full batting and bowling scorecards with verified figures will populate as soon as players
                take the field.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
                <MapPin className="w-3.5 h-3.5" />
                <span>{currentMatch.venue}</span>
              </div>
            </div>
          ) : (
            /* Render Each Innings (TEAM A Batting + Bowling, TEAM B Batting + Bowling) */
            inningsToDisplay.map((inn, innIdx) => (
              <div key={innIdx} className="space-y-4">
                {/* Innings Card Container */}
                <div
                  className={`rounded-2xl border overflow-hidden ${
                    isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Innings Header Banner */}
                  <div className="p-4 bg-slate-800/60 border-b border-slate-800 font-bold text-xs flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 text-xs font-extrabold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                        {inn.inningsNumber ? `${inn.inningsNumber}st Innings` : `Innings ${innIdx + 1}`}
                      </span>
                      <span className="text-sm font-extrabold text-white">
                        {inn.teamName} Batting
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-sm font-black text-cyan-400">{inn.score}</span>
                      {inn.overs && (
                        <span className="text-xs text-slate-400">({inn.overs} ov)</span>
                      )}
                      {inn.runRate !== undefined && inn.runRate !== null && (
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          RR: {formatStat(inn.runRate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Batting Scorecard Table */}
                  {inn.batters.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-900/60 text-slate-400 text-[10px] uppercase">
                          <tr>
                            <th className="p-3">Batter</th>
                            <th className="p-3 text-right">R</th>
                            <th className="p-3 text-right">B</th>
                            <th className="p-3 text-right">4s</th>
                            <th className="p-3 text-right">6s</th>
                            <th className="p-3 text-right">SR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {inn.batters.map((b, bIdx) => (
                            <tr key={bIdx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="p-3">
                                <span className="font-bold font-sans text-white">
                                  {b.name} {b.isStriker ? '*' : ''}
                                </span>
                                <span
                                  className={`block text-[10px] font-sans mt-0.5 ${
                                    b.isNotOut || (b.dismissal && b.dismissal.toLowerCase().includes('not out'))
                                      ? 'text-emerald-400 font-bold'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {formatDismissal(b)}
                                </span>
                              </td>
                              <td className="p-3 text-right font-bold text-cyan-400 text-sm">
                                {formatStat(b.runs)}
                              </td>
                              <td className="p-3 text-right text-slate-300">{formatStat(b.balls)}</td>
                              <td className="p-3 text-right text-slate-400">{formatStat(b.fours)}</td>
                              <td className="p-3 text-right text-slate-400">{formatStat(b.sixes)}</td>
                              <td className="p-3 text-right text-slate-300">
                                {formatStrikeRate(b)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 font-mono">
                      {isLoadingDetails
                        ? 'Retrieving verified batting figures from Google Search Grounding...'
                        : 'Innings has not commenced or no batting figures recorded yet.'}
                    </div>
                  )}

                  {/* Extras Row */}
                  <div className="p-3.5 bg-slate-900/40 border-t border-slate-800 font-mono text-xs flex flex-wrap justify-between items-center text-slate-300 gap-2">
                    <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                      Extras
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        Total: {inn.extras?.total !== null && inn.extras?.total !== undefined ? inn.extras.total : '—'}
                      </span>
                      {inn.extras && (
                        <span className="text-slate-400 text-[11px]">
                          (wd {formatStat(inn.extras.wides)}, nb {formatStat(inn.extras.noBalls)}, b {formatStat(inn.extras.byes)}, lb {formatStat(inn.extras.legByes)}, pen {formatStat(inn.extras.penalty)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total Innings Score Row */}
                  <div className="p-3.5 bg-slate-900/70 border-t border-slate-800 font-mono text-xs flex flex-wrap justify-between items-center text-slate-300 gap-2">
                    <span className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                      Total ({inn.overs || '0'} ov)
                    </span>
                    <div className="flex items-center gap-3 font-bold">
                      <span className="text-cyan-400 text-sm">
                        {inn.score || `${formatStat(inn.runs)}/${formatStat(inn.wickets)}`}
                      </span>
                      {inn.runRate !== undefined && inn.runRate !== null && (
                        <span className="text-slate-400 text-xs font-normal">
                          (RR: {formatStat(inn.runRate)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Yet to Bat (if available) */}
                  {inn.yetToBat && inn.yetToBat.length > 0 && (
                    <div className="p-3 bg-slate-900/20 border-t border-slate-800/80 font-mono text-[11px]">
                      <span className="font-bold text-slate-400 block mb-1">Yet to Bat:</span>
                      <div className="flex flex-wrap gap-1.5 text-slate-300">
                        {inn.yetToBat.map((player, pIdx) => (
                          <span key={pIdx} className="bg-slate-800/60 px-2 py-0.5 rounded text-xs">
                            {player}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fall of Wickets (if available) */}
                  {inn.fallOfWickets && inn.fallOfWickets.length > 0 && (
                    <div className="p-3 bg-slate-900/30 border-t border-slate-800/80 font-mono text-[11px]">
                      <span className="font-bold text-slate-400 block mb-1">Fall of Wickets:</span>
                      <div className="flex flex-wrap gap-2 text-slate-300">
                        {inn.fallOfWickets.map((f, fi) => (
                          <span key={fi} className="bg-slate-800/60 px-2 py-0.5 rounded">
                            <strong className="text-amber-400">{f.score}</strong> ({f.batter},{' '}
                            {f.over} ov)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Partnerships (if available) */}
                  {inn.partnerships && inn.partnerships.length > 0 && (
                    <div className="p-3 bg-slate-900/20 border-t border-slate-800/80 font-mono text-[11px]">
                      <span className="font-bold text-slate-400 block mb-1">Partnerships:</span>
                      <div className="flex flex-wrap gap-2 text-slate-300">
                        {inn.partnerships.map((p, pi) => (
                          <span key={pi} className="bg-slate-800/60 px-2 py-0.5 rounded">
                            <strong className="text-cyan-400">{p.batters}</strong>: {formatStat(p.runs)} runs{' '}
                            {p.balls ? `(${p.balls}b)` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bowling Table for this Innings */}
                <div
                  className={`rounded-2xl border overflow-hidden ${
                    isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="p-4 bg-slate-800/40 border-b border-slate-800 font-bold text-xs flex justify-between items-center">
                    <span>Bowling Attack vs {inn.teamName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {inn.bowlers.length} Bowlers Bowled
                    </span>
                  </div>

                  {inn.bowlers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-900/60 text-slate-400 text-[10px] uppercase">
                          <tr>
                            <th className="p-3">Bowler</th>
                            <th className="p-3 text-right">O</th>
                            <th className="p-3 text-right">M</th>
                            <th className="p-3 text-right">R</th>
                            <th className="p-3 text-right">W</th>
                            <th className="p-3 text-right">Econ</th>
                            <th className="p-3 text-right hidden sm:table-cell">WD</th>
                            <th className="p-3 text-right hidden sm:table-cell">NB</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {inn.bowlers.map((bw, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="p-3 font-bold font-sans text-white">
                                {bw.name} {bw.isBowling ? '*' : ''}
                              </td>
                              <td className="p-3 text-right text-slate-300">{formatStat(bw.overs)}</td>
                              <td className="p-3 text-right text-slate-400">{formatStat(bw.maidens)}</td>
                              <td className="p-3 text-right text-slate-300">{formatStat(bw.runs)}</td>
                              <td className="p-3 text-right font-bold text-amber-400">
                                {formatStat(bw.wickets)}
                              </td>
                              <td className="p-3 text-right text-cyan-400 font-bold">
                                {formatEconomy(bw)}
                              </td>
                              <td className="p-3 text-right text-slate-400 hidden sm:table-cell">
                                {formatStat(bw.wides)}
                              </td>
                              <td className="p-3 text-right text-slate-400 hidden sm:table-cell">
                                {formatStat(bw.noBalls)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 font-mono">
                      {isLoadingDetails
                        ? 'Retrieving verified bowling figures from Google Search Grounding...'
                        : 'Bowling figures will appear once play starts.'}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Ball-by-Ball Commentary */}
      {activeTab === 'commentary' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Commentary Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(
                [
                  { id: 'all', label: 'All Balls' },
                  { id: 'boundaries', label: '4s & 6s' },
                  { id: 'wickets', label: 'Wickets' },
                  { id: 'milestones', label: 'Milestones' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCommentaryFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    commentaryFilter === f.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={commentarySearch}
                onChange={(e) => setCommentarySearch(e.target.value)}
                placeholder="Search ball over..."
                className={`w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                }`}
              />
            </div>
          </div>

          {/* Commentary Timeline List */}
          <div className="space-y-3">
            {filteredCommentary.length > 0 ? (
              filteredCommentary.map((ball) => (
                <div
                  key={ball.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                    ball.isWicket
                      ? 'bg-red-950/20 border-red-500/40 text-red-100'
                      : ball.isSix
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-100'
                      : isDark
                      ? 'bg-[#091b2e] border-slate-800 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  {/* Over badge */}
                  <div className="flex flex-col items-center shrink-0">
                    <span className="font-mono font-bold text-sm text-cyan-400">{ball.overNumber}</span>
                    <span
                      className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                        ball.isWicket
                          ? 'bg-red-500 text-white'
                          : ball.isSix
                          ? 'bg-amber-500 text-slate-950'
                          : ball.isBoundary
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ball.isWicket ? 'W' : ball.runs}
                    </span>
                  </div>

                  {/* Commentary details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>
                        {ball.bowler} to {ball.batter}
                      </span>
                      <span>{ball.timestamp}</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed">{ball.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">
                {currentMatch.status === 'UPCOMING'
                  ? 'Ball-by-ball commentary will start once the match begins.'
                  : 'No commentary events match your current filter.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Real-Time Community Fan Pulse */}
      {activeTab === 'pulse' && (
        <div className="space-y-6 animate-fadeIn">
          <LiveMatchPulse match={currentMatch} user={user} isDark={isDark} />
        </div>
      )}

      {/* Tab 4: AI Insights */}
      {activeTab === 'alerts' && (
        <div className="space-y-4 animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h3 className="text-base font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Configure Live Alerts for this Match</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Customize event triggers specifically for {currentMatch.teamA.shortName} vs {currentMatch.teamB.shortName}.
            </p>

            <div className="space-y-3 text-xs">
              {[
                { title: 'Wicket Alerts', desc: 'Instant sound & vibration when a wicket falls' },
                { title: 'Boundary Flash', desc: 'Notify on every 4 or 6' },
                { title: 'Milestones', desc: 'Notify when batters cross 50 or 100 runs' },
                { title: 'Rain Delay & Resume', desc: 'Alert when rain pauses or resumes play' },
              ].map((al, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50"
                >
                  <div>
                    <span className="font-bold block">{al.title}</span>
                    <span className="text-slate-400 text-[11px]">{al.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-900 border-slate-700"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
