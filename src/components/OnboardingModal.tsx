import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Trophy,
  Users,
  Bell,
  ArrowRight,
  ShieldCheck,
  Check,
  Loader2,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { updateUserProfile, updateUserPreferences } from '../services/userService';
import {
  getAvailableTeamNames,
  getActivePlayersForTeams,
  filterValidPlayersForTeams,
} from '../services/cricketDataService';
import { UserProfile } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  user: UserProfile;
  onComplete: (updatedTeams: string[], updatedPlayers: string[]) => void;
  isDark: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  user,
  onComplete,
  isDark,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(() => {
    return user.favoriteTeams && user.favoriteTeams.length > 0 ? user.favoriteTeams : ['India'];
  });
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(() => {
    const initialTeams = user.favoriteTeams && user.favoriteTeams.length > 0 ? user.favoriteTeams : ['India'];
    const validInitial = filterValidPlayersForTeams(user.favoritePlayers || ['Virat Kohli'], initialTeams);
    return validInitial;
  });
  const [alertPreset, setAlertPreset] = useState<'balanced' | 'all' | 'key' | 'wickets'>('balanced');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const availableTeams = getAvailableTeamNames();
  const dynamicPlayers = getActivePlayersForTeams(selectedTeams);

  const toggleTeam = (team: string) => {
    setSelectedTeams((prev) => {
      const nextTeams = prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team];
      // Automatically keep only players who belong to the newly selected teams
      setSelectedPlayers((currentPlayers) => filterValidPlayersForTeams(currentPlayers, nextTeams));
      return nextTeams;
    });
  };

  const togglePlayer = (player: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(player) ? prev.filter((p) => p !== player) : [...prev, player]
    );
  };

  const handleFinishOnboarding = async () => {
    setSaving(true);
    const currentUser = auth.currentUser;

    if (currentUser?.uid) {
      try {
        await updateUserPreferences(currentUser.uid, {
          followedTeams: selectedTeams,
          followedPlayers: selectedPlayers,
          defaultAlertPreset: alertPreset,
        });

        await updateUserProfile(currentUser.uid, {
          onboardingCompleted: true,
        });
      } catch (err) {
        console.error('Error saving onboarding preferences:', err);
      }
    }

    setSaving(false);
    onComplete(selectedTeams, selectedPlayers);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-xl overflow-hidden rounded-3xl border shadow-2xl transition-all ${
          isDark
            ? 'bg-[#091b2e] border-slate-700 text-white shadow-cyan-950/40'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
        }`}
      >
        {/* Progress Bar Header */}
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                Personalization • Step {step} of 3
              </h3>
              <p className="text-sm font-extrabold">Welcome, {user.name || 'Cricket Fan'}!</p>
            </div>
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  step === s ? 'w-6 bg-cyan-400' : s < step ? 'w-2 bg-cyan-600' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1: TEAMS */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h4 className="text-base font-extrabold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Select Teams You Follow
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  We'll customize your match alerts and news feed for these teams.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {availableTeams.map((team) => {
                  const isSelected = selectedTeams.includes(team);
                  return (
                    <button
                      key={team}
                      type="button"
                      onClick={() => toggleTeam(team)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                          : isDark
                          ? 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:border-slate-600'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{team}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 bg-cyan-500 text-slate-950 font-bold text-xs rounded-2xl hover:bg-cyan-400 flex items-center justify-center gap-2 mt-4"
              >
                <span>Continue to Player Selection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: PLAYERS */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h4 className="text-base font-extrabold flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Follow Star Players
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Get instant milestone alerts whenever your favorite players hit key stats.
                </p>
              </div>

              {dynamicPlayers.length === 0 ? (
                <div
                  className={`p-6 text-center rounded-2xl border ${
                    isDark
                      ? 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Users className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-bold">No current players available for the selected teams.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Please go back to Step 1 and select at least one team to view active squad players.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {dynamicPlayers.map((player) => {
                    const isSelected = selectedPlayers.includes(player.name);
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => togglePlayer(player.name)}
                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                            : isDark
                            ? 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:border-slate-600'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col text-left">
                          <span className="truncate">{player.name}</span>
                          {selectedTeams.length > 1 && (
                            <span className="text-[10px] text-slate-400 font-normal">{player.team}</span>
                          )}
                        </div>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 ml-1" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`px-4 py-3 rounded-2xl border text-xs font-bold transition-all ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-cyan-500 text-slate-950 font-bold text-xs rounded-2xl hover:bg-cyan-400 flex items-center justify-center gap-2"
                >
                  <span>Set Alert Preferences</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ALERT PRESET & CONFIRM */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h4 className="text-base font-extrabold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-400" />
                  Choose Alert Level
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select how often you want to receive push notifications during live matches.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'balanced',
                    title: 'Balanced (Recommended)',
                    desc: 'Wickets, 50s, 100s, rain delays & match results',
                  },
                  {
                    id: 'all',
                    title: 'All Match Events',
                    desc: 'Boundaries, overs, milestones & full ball-by-ball commentary',
                  },
                  {
                    id: 'wickets',
                    title: 'Wickets Only',
                    desc: 'Notified only when a batter gets dismissed',
                  },
                ].map((preset) => {
                  const isSelected = alertPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAlertPreset(preset.id as any)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                          : isDark
                          ? 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:border-slate-600'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-cyan-400 bg-cyan-500' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-slate-950" />}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{preset.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{preset.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`px-4 py-3 rounded-2xl border text-xs font-bold transition-all ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  disabled={saving}
                  className="flex-1 py-3 bg-cyan-500 text-slate-950 font-bold text-xs rounded-2xl hover:bg-cyan-400 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Saving Profile...' : 'Complete & Go to Home'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
