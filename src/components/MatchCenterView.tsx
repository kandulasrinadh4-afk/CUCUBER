import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Share2,
  AlertCircle,
  Bell,
  CheckCircle2,
  Search,
  ExternalLink,
  RefreshCw,
  Clock,
  Trophy,
  Award,
  MapPin,
  Calendar,
  Layers,
  FileText,
  Check,
} from 'lucide-react';
import { MatchData, UserProfile, InningsScorecard } from '../types';
import { TeamLogo } from './TeamLogo';
import { LiveMatchPulse } from './LiveMatchPulse';
import {
  fetchMatchById,
  fetchMatchScorecard,
  hasDetailedScorecard,
  isSafeHttpUrl,
  mergeMatchSafely,
} from '../services/cricketDataService';

interface MatchCenterViewProps {
  match: MatchData;
  onBack: () => void;
  onOpenCatchUp: (match: MatchData) => void;
  onMatchUpdate?: (match: MatchData) => void;
  user: UserProfile;
}

const formatOrdinal = (n: number): string => {
  const abs = Math.abs(Math.trunc(n));
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${abs}th`;
  switch (abs % 10) {
    case 1:
      return `${abs}st`;
    case 2:
      return `${abs}nd`;
    case 3:
      return `${abs}rd`;
    default:
      return `${abs}th`;
  }
};

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

  const [scorecardNotice, setScorecardNotice] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const latestMatchRef = useRef<MatchData>(currentMatch);
  latestMatchRef.current = currentMatch;
  const activeRequestIdRef = useRef<number>(0);

  const isDark = user.theme === 'dark';

  const loadDetails = async (forceRefresh: boolean = false) => {
    const targetMatchId = match.id;
    const reqId = ++activeRequestIdRef.current;

    if (forceRefresh) {
      setIsManualRefreshing(true);
    } else {
      setIsLoadingDetails(true);
    }

    try {
      const scRes = await fetchMatchScorecard(targetMatchId, forceRefresh);
      if (reqId !== activeRequestIdRef.current) return;

      if (scRes.scorecardAvailable && scRes.match && hasDetailedScorecard(scRes.match)) {
        latestMatchRef.current = scRes.match;
        setCurrentMatch(scRes.match);
        onMatchUpdate?.(scRes.match);
        setDetailsError(null);
        setScorecardNotice(
          scRes.partial ? 'Partial scorecard available from provider; remaining entries awaiting update.' : null
        );
        return;
      }

      // Dedicated scorecard endpoint returned non-200 or unavailable (e.g., upcoming / not yet published)
      let candidateMatch: MatchData | null = scRes.match;
      const shouldFallbackDetail =
        !candidateMatch &&
        scRes.code !== 'PROVIDER_NOT_CONFIGURED' &&
        scRes.code !== 'RATE_LIMITED' &&
        scRes.code !== 'NOT_FOUND';

      if (shouldFallbackDetail) {
        candidateMatch = await fetchMatchById(targetMatchId, forceRefresh);
        if (reqId !== activeRequestIdRef.current) return;
      }

      const currentAfterAwait = latestMatchRef.current;
      let resolvedMatch = currentAfterAwait;

      if (candidateMatch) {
        if (hasDetailedScorecard(candidateMatch) || !hasDetailedScorecard(currentAfterAwait)) {
          resolvedMatch = candidateMatch;
        } else {
          resolvedMatch = mergeMatchSafely(currentAfterAwait, candidateMatch);
        }

        if (resolvedMatch !== currentAfterAwait) {
          latestMatchRef.current = resolvedMatch;
          setCurrentMatch(resolvedMatch);
          onMatchUpdate?.(resolvedMatch);
        }
      }

      if (!hasDetailedScorecard(resolvedMatch)) {
        setScorecardNotice(scRes.error || null);
      } else {
        setScorecardNotice(null);
      }
      setDetailsError(null);
    } catch (err: any) {
      if (reqId !== activeRequestIdRef.current) return;
      console.warn('Could not fetch match details:', err);
      setDetailsError('Live scorecard is temporarily unavailable. Displaying latest match overview.');
    } finally {
      if (reqId === activeRequestIdRef.current) {
        setIsLoadingDetails(false);
        setIsManualRefreshing(false);
      }
    }
  };

  // Preserve the currently loaded detailed scorecard while background fixture updates occur.
  // Only replace currentMatch when the newly fetched match actually contains valid detailed data.
  useEffect(() => {
    if (!match) return;

    const latest = latestMatchRef.current;
    if (match.id !== latest.id) {
      latestMatchRef.current = match;
      setCurrentMatch(match);
      return;
    }

    if (hasDetailedScorecard(match)) {
      latestMatchRef.current = match;
      setCurrentMatch(match);
    } else if (hasDetailedScorecard(latest)) {
      const merged = mergeMatchSafely(latest, match);
      latestMatchRef.current = merged;
      setCurrentMatch(merged);
    } else {
      latestMatchRef.current = match;
      setCurrentMatch(match);
    }
  }, [match]);

  useEffect(() => {
    let isMounted = true;

    const latest = latestMatchRef.current;
    if (latest.id !== match.id) {
      latestMatchRef.current = match;
      setCurrentMatch(match);
    } else if (!hasDetailedScorecard(latest) && hasDetailedScorecard(match)) {
      latestMatchRef.current = match;
      setCurrentMatch(match);
    }
    setSelectedInningsView('all');
    setDetailsError(null);
    setScorecardNotice(null);

    loadDetails(false);

    let interval: any = null;
    if (match.status === 'LIVE' || match.status === 'INTERRUPTED') {
      interval = setInterval(() => {
        if (isMounted) {
          loadDetails(false);
        }
      }, 45000);
    }

    return () => {
      isMounted = false;
      activeRequestIdRef.current += 1;
      if (interval) clearInterval(interval);
    };
  }, [match.id]);

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

  const handleShareMatch = async () => {
    const scorePart =
      currentMatch.teamA.score && currentMatch.teamA.score !== 'TBA'
        ? ` (${currentMatch.teamA.name} ${currentMatch.teamA.score} vs ${currentMatch.teamB.name} ${currentMatch.teamB.score || 'TBA'})`
        : '';
    const text = `${currentMatch.teamA.name} vs ${currentMatch.teamB.name}${scorePart} — ${currentMatch.tournament}. ${currentMatch.statusText || ''}`.trim();
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `${currentMatch.teamA.shortName} vs ${currentMatch.teamB.shortName} • CUCUBER`,
          text,
          url: window.location.href,
        });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // Ignore user-cancelled share dialog
    }
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
            <FileText className="w-3.5 h-3.5" />
            <span>Match Brief</span>
          </button>
          <button
            onClick={handleShareMatch}
            title={shareCopied ? 'Copied match summary' : 'Share match summary'}
            className={`p-2 rounded-xl border transition-colors flex items-center gap-1 text-xs font-bold ${
              shareCopied
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500'
                : isDark
                ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-950'
            }`}
          >
            {shareCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {shareCopied && <span className="hidden sm:inline">Copied</span>}
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

        {/* Freshness Timestamp & Provider Data Attribution */}
        <div className="mt-4 pt-3 border-t border-slate-500/15 flex flex-col sm:flex-row items-center justify-between text-xs font-mono gap-2">
          <div className="flex items-center gap-2">
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Feed: {currentMatch.provider === 'cricketdata' ? 'CricketData Secondary API' : 'Sportmonks Cricket API'}
            </span>
            {currentMatch.lastUpdated && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(currentMatch.lastUpdated).toLocaleTimeString()}</span>
              </span>
            )}
          </div>
          {isSafeHttpUrl(currentMatch.sourceUrl) && (
            <a
              href={currentMatch.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:underline flex items-center gap-1 font-bold"
            >
              <span>Provider source</span>
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
            { id: 'alerts', label: 'Match Alerts' },
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
                <p className={`font-bold text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>
                  {currentMatch.result || currentMatch.statusText || 'In Progress'}
                </p>
                {currentMatch.winner && (
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Winner:</span>{' '}
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>{currentMatch.winner}</strong>
                    {currentMatch.margin && (
                      <span className={`ml-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700 font-semibold'}`}>({currentMatch.margin})</span>
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
                <span className={`text-[10px] uppercase font-mono block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Venue & Ground
                </span>
                <p className={`font-bold text-xs flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
                  <span>{currentMatch.venue || 'Stadium Ground'}</span>
                </p>
                {(currentMatch.city || currentMatch.country) && (
                  <p className={`text-[11px] mt-1 pl-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
                <span className={`text-[10px] uppercase font-mono block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Toss
                </span>
                <p className={`font-medium text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
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
                          <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{batter.name}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700 font-bold'}`}>
                            {batter.teamShort}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-mono ${
                            batter.isNotOut || (batter.dismissal && batter.dismissal.toLowerCase().includes('not out'))
                              ? isDark ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold'
                              : isDark ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          {formatDismissal(batter)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span className={`font-bold text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                          {formatStat(batter.runs)}{' '}
                          <span className="text-slate-500 text-xs">({formatStat(batter.balls)}b)</span>
                        </span>
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          4s:{formatStat(batter.fours)} 6s:{formatStat(batter.sixes)}
                        </span>
                        <span className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>SR:{formatStrikeRate(batter)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2 font-mono">
                  {isLoadingDetails
                    ? 'Retrieving verified batting figures from Sportmonks Cricket API...'
                    : scorecardNotice || 'Batting statistics are recorded in the Scorecard tab when available.'}
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
                  ? 'Retrieving live batting figures from Sportmonks Cricket API...'
                  : scorecardNotice || 'Batting figures will appear when provided by the live scorecard feed.'}
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
                        <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{bowler.name}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700 font-bold'}`}>
                          {bowler.teamShort}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                          {formatStat(bowler.overs)} ov ({formatStat(bowler.runs)}r -{' '}
                          <strong className={isDark ? 'text-amber-400' : 'text-amber-700'}>{formatStat(bowler.wickets)}w</strong>)
                        </span>
                        <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                          Econ: {formatEconomy(bowler)}
                        </span>
                        <span className={`text-[11px] hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          M:{formatStat(bowler.maidens)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2 font-mono">
                  {isLoadingDetails
                    ? 'Retrieving verified bowling figures from Sportmonks Cricket API...'
                    : scorecardNotice || 'Detailed bowling performance appears in the Scorecard tab when available.'}
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
                  ? 'Retrieving live bowler data from Sportmonks Cricket API...'
                  : scorecardNotice || 'Bowler figures will appear once available from the live feed.'}
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
                        <strong className={isDark ? 'text-cyan-400' : 'text-cyan-700'}>{p.batters}</strong>:{' '}
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatStat(p.runs)} runs</span>{' '}
                        {p.balls ? `(${p.balls}b)` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {allFallOfWickets.length > 0 && (
                <div className={`space-y-1.5 pt-2 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
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
                        <strong className={isDark ? 'text-amber-400' : 'text-amber-700'}>{f.score}</strong> ({f.batter},{' '}
                        {f.over} ov)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
              <Calendar className={`w-8 h-8 mx-auto mb-3 animate-pulse ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <h4 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Match Scheduled</h4>
              <p className={`text-xs max-w-md mx-auto mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {currentMatch.startTime
                  ? `Scheduled to commence on ${new Date(currentMatch.startTime).toLocaleString()}.`
                  : 'Fixture scheduled to start shortly.'}{' '}
                Full batting and bowling scorecards with verified figures will populate as soon as players
                take the field.
              </p>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono ${isDark ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-800'}`}>
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
                    isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  {/* Innings Header Banner */}
                  <div className={`p-4 border-b font-bold text-xs flex justify-between items-center ${isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded border ${isDark ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-cyan-800 bg-cyan-100 border-cyan-300'}`}>
                        {inn.inningsNumber ? `${formatOrdinal(inn.inningsNumber)} Innings` : `Innings ${innIdx + 1}`}
                      </span>
                      <span className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {inn.teamName} Batting
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className={`text-sm font-black ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{inn.score}</span>
                      {inn.overs && (
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>({inn.overs} ov)</span>
                      )}
                      {inn.runRate !== undefined && inn.runRate !== null && (
                        <span className={`text-[11px] hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          RR: {formatStat(inn.runRate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Batting Scorecard Table */}
                  {inn.batters.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className={`text-[10px] uppercase ${isDark ? 'bg-slate-900/60 text-slate-400' : 'bg-slate-50 text-slate-600 border-b border-slate-200'}`}>
                          <tr>
                            <th className="p-3">Batter</th>
                            <th className="p-3 text-right">R</th>
                            <th className="p-3 text-right">B</th>
                            <th className="p-3 text-right">4s</th>
                            <th className="p-3 text-right">6s</th>
                            <th className="p-3 text-right">SR</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}>
                          {inn.batters.map((b, bIdx) => (
                            <tr key={bIdx} className={`transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                              <td className="p-3">
                                <span className={`font-bold font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {b.name} {b.isStriker ? '*' : ''}
                                </span>
                                <span
                                  className={`block text-[10px] font-sans mt-0.5 ${
                                    b.isNotOut || (b.dismissal && b.dismissal.toLowerCase().includes('not out'))
                                      ? isDark ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold'
                                      : isDark ? 'text-slate-400' : 'text-slate-600'
                                  }`}
                                >
                                  {formatDismissal(b)}
                                </span>
                              </td>
                              <td className={`p-3 text-right font-bold text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                {formatStat(b.runs)}
                              </td>
                              <td className={`p-3 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{formatStat(b.balls)}</td>
                              <td className={`p-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{formatStat(b.fours)}</td>
                              <td className={`p-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{formatStat(b.sixes)}</td>
                              <td className={`p-3 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
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
                        ? 'Retrieving verified batting figures from Sportmonks Cricket API...'
                        : scorecardNotice || 'Innings has not commenced or no batting figures recorded yet.'}
                    </div>
                  )}

                  {/* Extras Row */}
                  <div className={`p-3.5 border-t font-mono text-xs flex flex-wrap justify-between items-center gap-2 ${isDark ? 'bg-slate-900/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className={`font-bold text-[11px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Extras
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Total: {inn.extras?.total !== null && inn.extras?.total !== undefined ? inn.extras.total : '—'}
                      </span>
                      {inn.extras && (
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          (wd {formatStat(inn.extras.wides)}, nb {formatStat(inn.extras.noBalls)}, b {formatStat(inn.extras.byes)}, lb {formatStat(inn.extras.legByes)}, pen {formatStat(inn.extras.penalty)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total Innings Score Row */}
                  <div className={`p-3.5 border-t font-mono text-xs flex flex-wrap justify-between items-center gap-2 ${isDark ? 'bg-slate-900/70 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'}`}>
                    <span className={`font-bold uppercase tracking-wider text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Total ({inn.overs || '0'} ov)
                    </span>
                    <div className="flex items-center gap-3 font-bold">
                      <span className={`text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                        {inn.score || `${formatStat(inn.runs)}/${formatStat(inn.wickets)}`}
                      </span>
                      {inn.runRate !== undefined && inn.runRate !== null && (
                        <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          (RR: {formatStat(inn.runRate)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Yet to Bat (if available) */}
                  {inn.yetToBat && inn.yetToBat.length > 0 && (
                    <div className={`p-3 border-t font-mono text-[11px] ${isDark ? 'bg-slate-900/20 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                      <span className={`font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Yet to Bat:</span>
                      <div className={`flex flex-wrap gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                        {inn.yetToBat.map((player, pIdx) => (
                          <span key={pIdx} className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-slate-800/60' : 'bg-slate-100 border border-slate-200'}`}>
                            {player}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fall of Wickets (if available) */}
                  {inn.fallOfWickets && inn.fallOfWickets.length > 0 && (
                    <div className={`p-3 border-t font-mono text-[11px] ${isDark ? 'bg-slate-900/30 border-slate-800/80' : 'bg-slate-50/70 border-slate-200'}`}>
                      <span className={`font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Fall of Wickets:</span>
                      <div className={`flex flex-wrap gap-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                        {inn.fallOfWickets.map((f, fi) => (
                          <span key={fi} className={`px-2 py-0.5 rounded ${isDark ? 'bg-slate-800/60' : 'bg-white border border-slate-200'}`}>
                            <strong className={isDark ? 'text-amber-400' : 'text-amber-700'}>{f.score}</strong> ({f.batter},{' '}
                            {f.over} ov)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Partnerships (if available) */}
                  {inn.partnerships && inn.partnerships.length > 0 && (
                    <div className={`p-3 border-t font-mono text-[11px] ${isDark ? 'bg-slate-900/20 border-slate-800/80' : 'bg-white border-slate-200'}`}>
                      <span className={`font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Partnerships:</span>
                      <div className={`flex flex-wrap gap-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                        {inn.partnerships.map((p, pi) => (
                          <span key={pi} className={`px-2 py-0.5 rounded ${isDark ? 'bg-slate-800/60' : 'bg-slate-100 border border-slate-200'}`}>
                            <strong className={isDark ? 'text-cyan-400' : 'text-cyan-700'}>{p.batters}</strong>: {formatStat(p.runs)} runs{' '}
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
                    isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className={`p-4 border-b font-bold text-xs flex justify-between items-center ${isDark ? 'bg-slate-800/40 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`}>
                    <span>Bowling Attack vs {inn.teamName}</span>
                    <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {inn.bowlers.length} Bowlers Bowled
                    </span>
                  </div>

                  {inn.bowlers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className={`text-[10px] uppercase ${isDark ? 'bg-slate-900/60 text-slate-400' : 'bg-slate-50 text-slate-600 border-b border-slate-200'}`}>
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
                        <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}>
                          {inn.bowlers.map((bw, idx) => (
                            <tr key={idx} className={`transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                              <td className={`p-3 font-bold font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {bw.name} {bw.isBowling ? '*' : ''}
                              </td>
                              <td className={`p-3 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{formatStat(bw.overs)}</td>
                              <td className={`p-3 text-right ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{formatStat(bw.maidens)}</td>
                              <td className={`p-3 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{formatStat(bw.runs)}</td>
                              <td className={`p-3 text-right font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                                {formatStat(bw.wickets)}
                              </td>
                              <td className={`p-3 text-right font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                {formatEconomy(bw)}
                              </td>
                              <td className={`p-3 text-right hidden sm:table-cell ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                {formatStat(bw.wides)}
                              </td>
                              <td className={`p-3 text-right hidden sm:table-cell ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
                        ? 'Retrieving verified bowling figures from Sportmonks Cricket API...'
                        : scorecardNotice || 'Bowling figures are not yet available from the data provider.'}
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
                      : isDark
                      ? 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:text-slate-950'
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
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
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
                      ? isDark ? 'bg-red-950/20 border-red-500/40 text-red-100' : 'bg-red-50 border-red-200 text-red-950'
                      : ball.isSix
                      ? isDark ? 'bg-amber-950/20 border-amber-500/40 text-amber-100' : 'bg-amber-50 border-amber-200 text-amber-950'
                      : isDark
                      ? 'bg-[#091b2e] border-slate-800 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  {/* Over badge */}
                  <div className="flex flex-col items-center shrink-0">
                    <span className={`font-mono font-bold text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{ball.overNumber}</span>
                    <span
                      className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                        ball.isWicket
                          ? 'bg-red-500 text-white'
                          : ball.isSix
                          ? 'bg-amber-500 text-slate-950'
                          : ball.isBoundary
                          ? 'bg-cyan-500 text-slate-950'
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
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
                  ? 'Ball-by-ball commentary will appear once the match begins (when included in your Sportmonks plan).'
                  : (currentMatch.commentary || []).length === 0
                  ? 'Ball-by-ball updates are unavailable for this match or not included in the current provider plan.'
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

      {/* Tab 4: Match Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-4 animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h3 className="text-base font-bold mb-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>Configure Live Alerts for this Match</span>
            </h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-bold block">{al.title}</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{al.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className={`w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 ${
                      isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                    }`}
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
