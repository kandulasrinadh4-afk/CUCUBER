import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Moon,
  Sun,
  Lock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  X,
  Globe,
  Plus,
  Bell,
  Heart,
  ShieldCheck,
  Radio,
  Newspaper,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { logOutUser } from '../services/authService';
import { updateUserPreferences } from '../services/userService';
import { fetchApiStatus, ApiConnectionStatus } from '../services/cricketDataService';
import { UserProfile, AuthScreenType } from '../types';

interface ProfileViewProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  onOpenAuthModal: (type: AuthScreenType) => void;
  onNavigateTab: (tab: 'home' | 'matches' | 'alerts' | 'news' | 'profile') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  setUser,
  onOpenAuthModal,
  onNavigateTab,
}) => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAddFollowingModal, setShowAddFollowingModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
  const [apiStatus, setApiStatus] = useState<ApiConnectionStatus | null>(null);
  const [loadingApiStatus, setLoadingApiStatus] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadStatus = async () => {
      setLoadingApiStatus(true);
      const res = await fetchApiStatus();
      if (isMounted && res) {
        setApiStatus(res);
      }
      if (isMounted) setLoadingApiStatus(false);
    };
    loadStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentUser = auth.currentUser;
  const isAuthenticated = !!currentUser;
  const isDark = user.theme === 'dark';

  const availableTeams = ['India', 'Australia', 'England', 'Pakistan', 'South Africa', 'New Zealand', 'West Indies'];
  const availablePlayers = ['Virat Kohli', 'Jasprit Bumrah', 'Rohit Sharma', 'Pat Cummins', 'Joe Root', 'Shaheen Afridi'];
  const languages = ['English (US)', 'Hindi (हिंदी)', 'Bengali (বাংলা)', 'Tamil (தமிழ்)', 'Urdu (اردو)', 'Spanish (Español)'];

  const handleLogOut = async () => {
    try {
      await logOutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Password validation checks
  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const matchesConfirm = newPassword && newPassword === confirmPassword;
  const isPasswordValid = hasLength && hasUpper && hasNumber && hasSpecial && matchesConfirm;

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowChangePasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 2000);
  };

  const toggleTeam = async (team: string) => {
    const updatedTeams = user.favoriteTeams.includes(team)
      ? user.favoriteTeams.filter((t) => t !== team)
      : [...user.favoriteTeams, team];

    setUser((prev) => ({
      ...prev,
      favoriteTeams: updatedTeams,
    }));

    if (currentUser?.uid) {
      try {
        await updateUserPreferences(currentUser.uid, { followedTeams: updatedTeams });
      } catch (err) {
        console.error('Failed to sync team preferences to Firestore:', err);
      }
    }
  };

  const togglePlayer = async (player: string) => {
    const updatedPlayers = user.favoritePlayers.includes(player)
      ? user.favoritePlayers.filter((p) => p !== player)
      : [...user.favoritePlayers, player];

    setUser((prev) => ({
      ...prev,
      favoritePlayers: updatedPlayers,
    }));

    if (currentUser?.uid) {
      try {
        await updateUserPreferences(currentUser.uid, { followedPlayers: updatedPlayers });
      } catch (err) {
        console.error('Failed to sync player preferences to Firestore:', err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-3xl mx-auto">
      {/* Profile Card Header */}
      <div
        className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center gap-5 ${
          isDark
            ? 'bg-gradient-to-br from-[#091b2e] to-[#051424] border-slate-800'
            : 'bg-white border-slate-200'
        }`}
      >
        <img
          src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
          alt={user.name}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
          }}
          className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400 p-0.5 shadow-lg shadow-cyan-500/20"
        />
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-extrabold">{user.name || 'Cricket Fan'}</h1>
            {currentUser ? (
              currentUser.emailVerified ? (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <button
                  onClick={() => onOpenAuthModal('otp')}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 hover:underline"
                >
                  <AlertTriangle className="w-3 h-3" /> VERIFY EMAIL
                </button>
              )
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-500/20 text-slate-700 dark:text-slate-400 border border-slate-500/30">
                GUEST
              </span>
            )}
          </div>
          <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>{user.email}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-2">
            {user.favoriteTeams.map((t) => (
              <span
                key={t}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isDark ? 'bg-slate-800 text-cyan-300 border-slate-700' : 'bg-cyan-50 text-cyan-900 border-cyan-200'
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: FOLLOWING TEAMS & PLAYERS */}
      <div
        className={`p-5 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <Heart className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
            <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'}`}>
              Following ({user.favoriteTeams.length + user.favoritePlayers.length})
            </h3>
          </div>
          <button
            onClick={() => setShowAddFollowingModal(true)}
            className={`text-xs font-bold hover:underline flex items-center gap-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}
          >
            <Plus className="w-3.5 h-3.5" /> Manage Following
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <span className={`text-[11px] font-mono block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-bold'}`}>Followed Teams:</span>
            {user.favoriteTeams.length === 0 ? (
              <span className={`text-xs italic ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>No teams followed yet.</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.favoriteTeams.map((t) => (
                  <span
                    key={t}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
                      isDark ? 'bg-slate-800 text-cyan-300 border-slate-700' : 'bg-cyan-50 text-cyan-950 border-cyan-200 font-bold'
                    }`}
                  >
                    <span>{t}</span>
                    <button onClick={() => toggleTeam(t)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className={`text-[11px] font-mono block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-bold'}`}>Followed Key Players:</span>
            {user.favoritePlayers.length === 0 ? (
              <span className={`text-xs italic ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>No players followed yet.</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.favoritePlayers.map((p) => (
                  <span
                    key={p}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
                      isDark ? 'bg-slate-800 text-emerald-300 border-slate-700' : 'bg-emerald-50 text-emerald-950 border-emerald-200 font-bold'
                    }`}
                  >
                    <span>{p}</span>
                    <button onClick={() => togglePlayer(p)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: APP PREFERENCES & SYSTEM SETTINGS */}
      <div
        className={`p-5 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'}`}>
          System & App Preferences
        </h3>

        <div className="space-y-3">
          {/* Theme Toggle */}
          <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-100 text-cyan-800'}`}>
                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="font-bold text-xs">Appearance Theme</h4>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  {isDark ? 'Dark Canvas (#051424)' : 'Light Canvas (#f8fafc)'}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                setUser((prev) => ({
                  ...prev,
                  theme: prev.theme === 'dark' ? 'light' : 'dark',
                }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300'
              }`}
            >
              Switch Theme
            </button>
          </div>

          {/* Language Selector */}
          <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <Globe className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <div>
                <h4 className="font-bold text-xs">Display Language</h4>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Language for scoreboards and match digests</p>
              </div>
            </div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${
                isDark ? 'bg-slate-800 text-cyan-300 border-slate-700' : 'bg-white text-slate-900 border-slate-300 shadow-2xs'
              }`}
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Notification Settings Link */}
          <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <Bell className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <div>
                <h4 className="font-bold text-xs">Notification Engine Rules</h4>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Configure wickets, rain delays, and sirens</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 shadow-2xs"
            >
              Open Alerts
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: LIVE DATA FEEDS & API CONNECTIVITY */}
      <div
        className={`p-5 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
            <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'}`}>
              Data Feeds & Live API Connectivity
            </h3>
          </div>
          <button
            onClick={async () => {
              setLoadingApiStatus(true);
              const res = await fetchApiStatus(true);
              if (res) setApiStatus(res);
              setLoadingApiStatus(false);
            }}
            disabled={loadingApiStatus}
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Verify live API connectivity status"
          >
            <RefreshCw className={`w-3 h-3 ${loadingApiStatus ? 'animate-spin' : ''}`} />
            <span className="text-[10px] hidden sm:inline">Verify Live</span>
          </button>
        </div>

        <div className="space-y-3">
          {/* Sportmonks Primary Matches API Feed Status */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl mt-0.5 ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-100 text-cyan-800'}`}>
                <Radio className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-xs">Matches &amp; Scorecard API</h4>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border ${
                      apiStatus?.matchesApi.verified
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : apiStatus?.matchesApi.cooldownRemainingSeconds
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : apiStatus?.matchesApi.primaryConfigured
                        ? 'bg-red-500/20 text-red-500 border-red-500/30'
                        : 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30'
                    }`}
                  >
                    {apiStatus?.matchesApi.verified
                      ? 'VERIFIED LIVE'
                      : apiStatus?.matchesApi.cooldownRemainingSeconds
                      ? `COOLDOWN (${apiStatus.matchesApi.cooldownRemainingSeconds}s)`
                      : apiStatus?.matchesApi.primaryConfigured
                      ? `AUTH ERROR (${apiStatus.matchesApi.verificationStatusCode || 'CHECK'})`
                      : 'TOKEN NOT CONFIGURED'}
                  </span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  Primary Provider: <span className="font-semibold">{apiStatus?.matchesApi.provider || 'Sportmonks Cricket API v2.0'}</span>
                  {apiStatus?.matchesApi.checkedAt && (
                    <span className="ml-2 text-[10px] opacity-75">
                      • Checked {new Date(apiStatus.matchesApi.checkedAt).toLocaleTimeString()}
                    </span>
                  )}
                </p>
                {apiStatus?.matchesApi.verificationError && (
                  <p className="text-[11px] text-amber-500 font-mono">
                    {apiStatus.matchesApi.verificationError}
                  </p>
                )}
                {apiStatus?.matchesApi.leagues && apiStatus.matchesApi.leagues.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {apiStatus.matchesApi.leagues.slice(0, 8).map((l) => (
                      <span
                        key={l.id}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                          isDark
                            ? 'bg-slate-900/70 text-cyan-300 border-slate-700'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {l.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('matches')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors shrink-0 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300'
              }`}
            >
              View Matches
            </button>
          </div>

          {/* Secondary Cricket Provider Adapter Status */}
          <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-100 text-cyan-800'}`}>
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-xs">Secondary Cricket Providers</h4>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border ${
                      apiStatus?.matchesApi.secondaryProviders?.some((p) => p.connected)
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30'
                    }`}
                  >
                    {apiStatus?.matchesApi.secondaryProviders?.some((p) => p.connected) ? 'FALLBACK ACTIVE' : 'OPTIONAL / UNCONFIGURED'}
                  </span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  {apiStatus?.matchesApi.secondaryProviders?.length
                    ? apiStatus.matchesApi.secondaryProviders
                        .map((p) => `${p.name} (${p.connected ? 'Configured' : 'Off'})`)
                        .join(', ')
                    : 'Extensible adapter registry (activated when provider credentials exist)'}
                </p>
              </div>
            </div>
          </div>

          {/* External Cricket News RSS Feed Status */}
          <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-100 text-cyan-800'}`}>
                <Newspaper className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-xs">Cricket News RSS Feeds</h4>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border ${
                      apiStatus?.newsApi.connected
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {apiStatus?.newsApi.connected ? 'RSS FEEDS ACTIVE' : 'UNAVAILABLE'}
                  </span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  Sources: <span className="font-semibold">{apiStatus?.newsApi.provider || 'ESPNcricinfo, BBC Sport Cricket, Cricket Australia, The Guardian'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('news')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300'
              }`}
            >
              View News
            </button>
          </div>
        </div>
      </div>


      {/* SECTION 3: PRIVACY & SECURITY */}
      <div
        className={`p-5 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'}`}>
          Privacy, Security & Auth
        </h3>

        <div className="space-y-3">
          <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <KeyRound className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <div>
                <h4 className="font-bold text-xs">Change Account Password</h4>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Update password with length and symbol rules</p>
              </div>
            </div>
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300 border-slate-300'
              }`}
            >
              Change
            </button>
          </div>

          <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <div>
                <h4 className="font-bold text-xs">Auth States Reference Matrix</h4>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Inspect login error states & OTP screens</p>
              </div>
            </div>
            <button
              onClick={() => onOpenAuthModal('auth-debug')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300 border-slate-300'
              }`}
            >
              View Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="flex gap-3 pt-2">
        {isAuthenticated ? (
          <button
            onClick={handleLogOut}
            className={`flex-1 py-3.5 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-red-950/30 hover:bg-red-900/40 text-red-300 border-red-800/50'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        ) : (
          <div className="flex gap-3 flex-1">
            <button
              onClick={() => onOpenAuthModal('signin')}
              className={`flex-1 py-3.5 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300 shadow-2xs'
              }`}
            >
              <LogOut className="w-4 h-4 rotate-180" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => onOpenAuthModal('signup')}
              className="flex-1 py-3.5 rounded-2xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
            >
              <User className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>
        )}
      </div>

      {/* Manage Following Modal */}
      {showAddFollowingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div
            className={`relative w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-5 ${
              isDark ? 'bg-[#091b2e] border-slate-700 text-white' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold">Manage Following</h3>
              <button onClick={() => setShowAddFollowingModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-mono font-bold text-slate-400 uppercase mb-2">Teams:</p>
                <div className="flex flex-wrap gap-2">
                  {availableTeams.map((t) => {
                    const isFollowed = user.favoriteTeams.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => toggleTeam(t)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
                          isFollowed ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isFollowed ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{t}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-mono font-bold text-slate-400 uppercase mb-2">Players:</p>
                <div className="flex flex-wrap gap-2">
                  {availablePlayers.map((p) => {
                    const isFollowed = user.favoritePlayers.includes(p);
                    return (
                      <button
                        key={p}
                        onClick={() => togglePlayer(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
                          isFollowed ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isFollowed ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAddFollowingModal(false)}
              className="w-full py-3 bg-cyan-500 text-slate-950 font-bold text-xs rounded-2xl"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div
            className={`relative w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-5 ${
              isDark ? 'bg-[#091b2e] border-slate-700 text-white' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                <span>Change Password</span>
              </h3>
              <button onClick={() => setShowChangePasswordModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="font-bold text-base text-emerald-400">Password Updated Successfully!</h4>
                <p className="text-xs text-slate-400">Your account security settings have been saved.</p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-2.5 text-slate-400"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>

                {/* Password Strength Checklist */}
                <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1.5 text-[11px]">
                  <p className="font-mono font-bold text-slate-400 text-[10px] uppercase">
                    Password Requirements:
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    <span className={hasLength ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {hasLength ? '✓' : '•'} 8+ Characters
                    </span>
                    <span className={hasUpper ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {hasUpper ? '✓' : '•'} Uppercase Letter
                    </span>
                    <span className={hasNumber ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {hasNumber ? '✓' : '•'} Number (0-9)
                    </span>
                    <span className={hasSpecial ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {hasSpecial ? '✓' : '•'} Special Symbol
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isPasswordValid}
                  className="w-full py-3 bg-cyan-500 text-slate-950 font-bold text-xs rounded-2xl disabled:opacity-50"
                >
                  Update Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
