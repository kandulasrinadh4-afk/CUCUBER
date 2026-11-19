import React, { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  Target,
  Sparkles,
  Send,
  Radio,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Award,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { MatchData, UserProfile, MatchReaction, ReactionType, CommunityPoll } from '../types';
import {
  subscribeToMatchReactions,
  sendMatchReaction,
  subscribeToCommunityPoll,
  subscribeToUserPollVote,
  castCommunityPollVote,
  getPulseClientId,
} from '../services/realtimeMatchService';
import { auth } from '../lib/firebase';

interface LiveMatchPulseProps {
  match: MatchData;
  user: UserProfile;
  isDark: boolean;
}

const REACTION_CONFIG: {
  type: ReactionType;
  label: string;
  emoji: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    type: 'fire',
    label: 'Heat',
    emoji: '🔥',
    icon: Flame,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 active:scale-95',
    borderColor: 'border-amber-500/30',
  },
  {
    type: 'six',
    label: 'Maximum',
    emoji: '🏏',
    icon: Sparkles,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20 active:scale-95',
    borderColor: 'border-cyan-500/30',
  },
  {
    type: 'wicket',
    label: 'Wicket!',
    emoji: '🎯',
    icon: Target,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10 hover:bg-rose-500/20 active:scale-95',
    borderColor: 'border-rose-500/30',
  },
  {
    type: 'clutch',
    label: 'Clutch',
    emoji: '⚡',
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20 active:scale-95',
    borderColor: 'border-yellow-500/30',
  },
  {
    type: 'cheer',
    label: 'Cheer',
    emoji: '👏',
    icon: Award,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95',
    borderColor: 'border-emerald-500/30',
  },
];

export const LiveMatchPulse: React.FC<LiveMatchPulseProps> = ({ match, user, isDark }) => {
  const [reactions, setReactions] = useState<MatchReaction[]>([]);
  const [shoutText, setShoutText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [lastReacted, setLastReacted] = useState<string | null>(null);
  const [pulseError, setPulseError] = useState<string | null>(null);

  // Initialize clean poll definition for the current match with 0 votes (no mock/hardcoded numbers)
  const defaultPoll: CommunityPoll = {
    id: `poll-${match.id}`,
    matchId: match.id,
    question: `Match Prediction: Who will seal the win?`,
    options: [
      { id: 'opt-teamA', label: `${match.teamA.name} (${match.teamA.shortName})`, votes: 0 },
      { id: 'opt-teamB', label: `${match.teamB.name} (${match.teamB.shortName})`, votes: 0 },
      { id: 'opt-tie', label: 'Super Over / Tie Thriller', votes: 0 },
    ],
    totalVotes: 0,
  };

  const [poll, setPoll] = useState<CommunityPoll>(defaultPoll);
  const [userVotedOption, setUserVotedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Determine current client UID (auth UID or stable guest device ID)
  const currentUid = auth.currentUser?.uid || getPulseClientId();

  // Reset poll and votes when switching matches
  useEffect(() => {
    setReactions([]);
    setUserVotedOption(null);
    setPulseError(null);
    setPoll({
      id: `poll-${match.id}`,
      matchId: match.id,
      question: `Match Prediction: Who will seal the win?`,
      options: [
        { id: 'opt-teamA', label: `${match.teamA.name} (${match.teamA.shortName})`, votes: 0 },
        { id: 'opt-teamB', label: `${match.teamB.name} (${match.teamB.shortName})`, votes: 0 },
        { id: 'opt-tie', label: 'Super Over / Tie Thriller', votes: 0 },
      ],
      totalVotes: 0,
    });
  }, [match.id, match.teamA.name, match.teamA.shortName, match.teamB.name, match.teamB.shortName]);

  // 1. Subscribe to Real-time Reactions for this Match
  useEffect(() => {
    if (!match.id) return;

    const unsubscribe = subscribeToMatchReactions(
      match.id,
      (freshReactions) => {
        setReactions(freshReactions);
      },
      (err) => {
        console.warn('Reactions subscription error:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [match.id]);

  // 2. Subscribe to Real-time Community Poll & Current User's Vote
  useEffect(() => {
    if (!match.id) return;

    const pollId = `poll-${match.id}`;
    const cleanDefault: CommunityPoll = {
      id: pollId,
      matchId: match.id,
      question: `Match Prediction: Who will seal the win?`,
      options: [
        { id: 'opt-teamA', label: `${match.teamA.name} (${match.teamA.shortName})`, votes: 0 },
        { id: 'opt-teamB', label: `${match.teamB.name} (${match.teamB.shortName})`, votes: 0 },
        { id: 'opt-tie', label: 'Super Over / Tie Thriller', votes: 0 },
      ],
      totalVotes: 0,
    };

    const unsubscribePoll = subscribeToCommunityPoll(
      pollId,
      cleanDefault,
      (freshPoll) => {
        setPoll(freshPoll);
      },
      (err) => {
        console.warn('Poll subscription error:', err);
      }
    );

    const unsubscribeVote = subscribeToUserPollVote(
      pollId,
      currentUid,
      (votedOption) => {
        setUserVotedOption(votedOption);
      },
      (err) => {
        console.warn('Vote subscription error:', err);
      }
    );

    return () => {
      unsubscribePoll();
      unsubscribeVote();
    };
  }, [match.id, currentUid, match.teamA.name, match.teamA.shortName, match.teamB.name, match.teamB.shortName]);

  // Handle Quick Emoji Reaction Click with duplicate prevention
  const handleQuickReaction = async (reactionType: ReactionType) => {
    if (isReacting) return;

    setIsReacting(true);
    setLastReacted(reactionType);
    setPulseError(null);

    try {
      await sendMatchReaction(match.id, reactionType, undefined, {
        uid: currentUid,
        displayName: user.name || (auth.currentUser?.displayName || 'Cricket Fan'),
        photoURL: user.avatar || (auth.currentUser?.photoURL || null),
      });
    } catch (err) {
      console.error('Could not send live reaction:', err);
      setPulseError(err instanceof Error ? err.message : 'Could not send live reaction. Please try again.');
    } finally {
      setTimeout(() => {
        setIsReacting(false);
        setLastReacted(null);
      }, 500);
    }
  };

  // Handle Submitting a Fan Shout Message
  const handleSendShout = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMsg = shoutText.trim();
    if (!cleanMsg || isPosting) return;

    setIsPosting(true);
    setPulseError(null);

    try {
      await sendMatchReaction(match.id, 'cheer', cleanMsg, {
        uid: currentUid,
        displayName: user.name || (auth.currentUser?.displayName || 'Cricket Fan'),
        photoURL: user.avatar || (auth.currentUser?.photoURL || null),
      });
      setShoutText('');
    } catch (err) {
      console.error('Could not post shout:', err);
      setPulseError(err instanceof Error ? err.message : 'Could not broadcast reaction message.');
    } finally {
      setIsPosting(false);
    }
  };

  // Handle Casting a Vote in Real Time (strictly 1 vote per user)
  const handleVote = async (optionId: string) => {
    if (isVoting || !!userVotedOption) return;

    setIsVoting(true);
    setPulseError(null);

    try {
      const pollId = `poll-${match.id}`;
      await castCommunityPollVote(pollId, currentUid, optionId, poll);
    } catch (err) {
      console.error('Could not cast poll vote:', err);
      setPulseError(err instanceof Error ? err.message : 'Could not record vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  // Aggregate reaction counts from real live Firestore data
  const reactionCounts: Record<string, number> = {};
  reactions.forEach((r) => {
    reactionCounts[r.reactionType] = (reactionCounts[r.reactionType] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Error Alert (if reaction or vote fails) */}
      {pulseError && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
            isDark ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{pulseError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPulseError(null)}
            className="text-[11px] font-bold underline hover:opacity-80 cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Real-Time Database Connection Status Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
          isDark ? 'bg-[#06182a] border-cyan-500/20' : 'bg-cyan-50/70 border-cyan-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-extrabold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                Real-Time Firestore Sync
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full font-bold ${isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-cyan-100 text-cyan-800'}`}>
                Cross-Client Live
              </span>
            </div>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Changes to reactions, cheers, and prediction votes sync instantaneously across all connected tabs and devices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <div className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${isDark ? 'bg-slate-900 border border-slate-800 text-slate-300' : 'bg-white border border-slate-200 text-slate-700'}`}>
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-bold">{reactions.length}</span>
            <span className="text-[10px] text-slate-400">live pulses</span>
          </div>
        </div>
      </div>

      {/* Grid: Left Column (Live Reactions & Shouts) & Right Column (Live Poll) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Reactions & Shouts */}
        <div className="lg:col-span-7 space-y-5">
          {/* Reaction Tap Buttons */}
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                  Live Match Reactions
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">
                Tap to broadcast
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {REACTION_CONFIG.map((cfg) => {
                const count = reactionCounts[cfg.type] || 0;
                const isJustReacted = lastReacted === cfg.type;

                return (
                  <button
                    key={cfg.type}
                    type="button"
                    disabled={isReacting}
                    onClick={() => handleQuickReaction(cfg.type)}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${cfg.bgColor} ${cfg.borderColor} ${
                      isJustReacted ? 'scale-110 ring-2 ring-cyan-400 shadow-lg' : ''
                    } ${isReacting ? 'opacity-80' : ''}`}
                  >
                    <span className="text-xl select-none animate-subtle">{cfg.emoji}</span>
                    <span className={`text-[10px] font-bold ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[9px] font-mono opacity-70">
                      {count > 0 ? count : '+1'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Shout to Live Fans Input */}
            <form onSubmit={handleSendShout} className="mt-4 flex gap-2">
              <input
                type="text"
                value={shoutText}
                onChange={(e) => setShoutText(e.target.value)}
                maxLength={140}
                placeholder="Broadcast a quick match reaction to all fans..."
                className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs border transition-colors outline-none ${
                  isDark
                    ? 'bg-slate-900/80 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600'
                }`}
              />
              <button
                type="submit"
                disabled={!shoutText.trim() || isPosting}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  shoutText.trim() && !isPosting
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                }`}
              >
                {isPosting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{isPosting ? 'Posting...' : 'Send'}</span>
              </button>
            </form>
          </div>

          {/* Live Fan Stream */}
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                  Real-Time Fan Stream
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Streaming live from Firestore
              </span>
            </div>

            {reactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400">No reactions yet for this match.</p>
                <p className="text-[11px] text-cyan-400 mt-1">
                  Be the first to tap a reaction button above!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {reactions.map((rx) => {
                  const cfg = REACTION_CONFIG.find((c) => c.type === rx.reactionType) || REACTION_CONFIG[0];
                  const timeDiff = Math.max(0, Math.floor((Date.now() - rx.createdAt) / 1000));
                  const timeDisplay = timeDiff < 5 ? 'Just now' : `${timeDiff}s ago`;

                  return (
                    <div
                      key={rx.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        isDark ? 'bg-slate-900/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">{cfg.emoji}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {rx.userName}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${cfg.color} ${cfg.bgColor}`}>
                              {cfg.label}
                            </span>
                          </div>
                          {rx.message && (
                            <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              &ldquo;{rx.message}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {timeDisplay}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Prediction Poll */}
        <div className="lg:col-span-5 space-y-5">
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                  Live Match Poll
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                1-Vote/Client
              </span>
            </div>

            <p className={`text-sm font-extrabold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {poll.question}
            </p>

            <div className="space-y-3">
              {poll.options.map((opt) => {
                const isSelected = userVotedOption === opt.id;
                const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                const isDisabled = isVoting || !!userVotedOption;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleVote(opt.id)}
                    disabled={isDisabled}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                      isDisabled && !isSelected ? 'cursor-not-allowed opacity-75' : isSelected ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      isSelected
                        ? isDark
                          ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-400'
                          : 'border-teal-600 bg-teal-50 ring-1 ring-teal-500'
                        : isDark
                        ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {/* Background Progress Fill */}
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-500 pointer-events-none opacity-20 ${
                        isSelected
                          ? 'bg-cyan-500'
                          : isDark
                          ? 'bg-slate-700'
                          : 'bg-teal-300'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                              : isDark
                              ? 'border-slate-600'
                              : 'border-slate-400'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`text-xs font-bold truncate ${isSelected ? (isDark ? 'text-cyan-300' : 'text-teal-900') : (isDark ? 'text-slate-200' : 'text-slate-800')}`}>
                          {opt.label}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs">
                          {percentage}%
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Total Votes: {poll.totalVotes}</span>
              {userVotedOption ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Vote recorded
                </span>
              ) : (
                <span className="text-cyan-400">Click to cast vote</span>
              )}
            </div>
          </div>

          {/* Test Real-Time Synchronization Card */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Multi-Client Synchronization</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Open this app in two side-by-side browser tabs. Tap any cheer button or vote on the poll in one tab, and watch the counters and live feed update in the other tab in real time with 0 page reloads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
