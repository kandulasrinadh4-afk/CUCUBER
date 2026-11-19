import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { getUserProfile, ensureUserProfileExists, subscribeToUserProfile } from './services/userService';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { MatchesView } from './components/MatchesView';
import { MatchCenterView } from './components/MatchCenterView';
import { AICatchUpModal } from './components/AICatchUpModal';
import { AlertsView } from './components/AlertsView';
import { NewsFeedView } from './components/NewsFeedView';
import { ProfileView } from './components/ProfileView';
import { MasterclassView } from './components/masterclass/MasterclassView';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SearchModal } from './components/SearchModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { GeminiChatbot } from './components/GeminiChatbot';
import { Sparkles } from 'lucide-react';

import { DEFAULT_USER } from './data/mockData';
import { MatchData, NewsArticle, UserProfile, AuthScreenType } from './types';
import {
  subscribeToCricketTelemetry,
  fetchCricketNews,
  fetchCricketMatches,
  subscribeToCricketNews,
  hasDetailedScorecard,
  mergeMatchSafely
} from './services/cricketDataService';

export function App() {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [authInitializing, setAuthInitializing] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);

  const [activeTab, setActiveTab] = useState<'home' | 'matches' | 'alerts' | 'news' | 'masterclass' | 'profile'>('home');
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [catchUpMatch, setCatchUpMatch] = useState<MatchData | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);

  const [authScreen, setAuthScreen] = useState<AuthScreenType>('none');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Real-time Cricket Match Data & News Subscription
  useEffect(() => {
    // Initial fetch to load matches immediately and resolve loading state cleanly
    fetchCricketMatches()
      .then((initialMatches) => {
        if (initialMatches && initialMatches.length > 0) {
          setMatches(initialMatches);
        }
      })
      .catch((err) => {
        console.warn('Initial matches fetch warning:', err);
      })
      .finally(() => {
        setMatchesLoading(false);
      });

    // Subscribe to real-time live match telemetry (polls every 180s to respect Gemini API quotas)
    const unsubscribe = subscribeToCricketTelemetry((liveMatches) => {
      if (liveMatches && liveMatches.length > 0) {
        setMatches(liveMatches);
        setMatchesLoading(false);

        // Keep active match center in sync with live ball updates
        setSelectedMatch((prevSelected) => {
          if (!prevSelected) return null;
          const fresh = liveMatches.find((m) => m.id === prevSelected.id);
          if (!fresh) return prevSelected;
          // If the selected match has already been loaded with detailed scorecard data,
          // DO NOT replace it with a fixture-only match.
          // Safely merge lightweight live summary fields without overwriting detailed fields.
          return mergeMatchSafely(prevSelected, fresh);
        });
      }
    }, 180000);

    // Subscribe to real-time grounded cricket news (with immediate cache delivery & cooldown auto-retry)
    const unsubscribeNews = subscribeToCricketNews((freshNews) => {
      if (freshNews && freshNews.length > 0) {
        setNews(freshNews);
      }
    }, 300000);

    return () => {
      unsubscribe();
      unsubscribeNews();
    };
  }, []);

  // Firebase Auth State & Real-Time Profile Listener
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        try {
          // Detect provider from providerData
          const isGoogle = firebaseUser.providerData.some((p) => p.providerId === 'google.com');

          // Check or create profile (never duplicates or resets existing profiles)
          await ensureUserProfileExists({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            providerId: isGoogle ? 'google' : 'password',
          });

          // Subscribe in real-time to Firestore profile changes
          unsubscribeProfile = subscribeToUserProfile(firebaseUser.uid, (profile) => {
            if (!profile) return;

            setUser({
              name: profile.displayName || firebaseUser.displayName || 'Cricket Fan',
              email: profile.email || firebaseUser.email || '',
              avatar: profile.photoURL || firebaseUser.photoURL || DEFAULT_USER.avatar,
              favoriteTeams: profile.preferences?.followedTeams || [],
              favoritePlayers: profile.preferences?.followedPlayers || [],
              theme: profile.preferences?.theme || 'dark',
              onboardingCompleted: profile.onboardingCompleted,
              masterclassProgress: profile.masterclassProgress || DEFAULT_USER.masterclassProgress,
              preferences: {
                preset: (profile.preferences?.defaultAlertPreset as any) || 'balanced',
                busyMode: profile.preferences?.busyModeEnabled || false,
                soundEnabled: profile.preferences?.notificationPreferences?.sound ?? true,
                vibrationEnabled: true,
                quietHours: { enabled: false, start: '23:00', end: '07:00' },
                events: {
                  matchStart: true,
                  toss: true,
                  matchResult: profile.preferences?.notificationPreferences?.matchResult ?? true,
                  wicket: profile.preferences?.notificationPreferences?.wickets ?? true,
                  halfCentury: profile.preferences?.notificationPreferences?.milestones ?? true,
                  century: profile.preferences?.notificationPreferences?.milestones ?? true,
                  boundaries: profile.preferences?.notificationPreferences?.boundaries ?? false,
                  rainDelay: profile.preferences?.notificationPreferences?.rainDelays ?? true,
                  playResumed: true,
                  criticalOvers: true,
                },
              },
            });

            // Check if onboarding needs to be completed
            if (profile.onboardingCompleted === false) {
              setIsOnboardingOpen(true);
            } else {
              setIsOnboardingOpen(false);
            }
          });
        } catch (err) {
          console.error('Error synchronizing user profile:', err);
        }
      } else {
        // Reset to default guest state when signed out
        setUser(DEFAULT_USER);
        setIsOnboardingOpen(false);
      }
      setAuthInitializing(false);
    });

    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
      unsubscribeAuth();
    };
  }, []);

  const [notifications, setNotifications] = useState<
    {
      id: string;
      title: string;
      body: string;
      time: string;
      type: 'wicket' | 'raindelay' | 'resume' | 'digest';
      matchId?: string;
      read: boolean;
    }[]
  >([]);

  const isDark = user.theme === 'dark';

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const handleSelectNotification = (notif: (typeof notifications)[0]) => {
    const matched = matches.find((m) => m.id === notif.matchId);
    if (matched) {
      setSelectedMatch(matched);
      setIsNotificationsOpen(false);
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleRefreshMatches = async () => {
    setMatchesLoading(true);
    try {
      const fresh = await fetchCricketMatches(true);
      if (fresh && fresh.length > 0) {
        setMatches(fresh);
      }
    } catch (err) {
      console.warn('Manual matches refresh error:', err);
    } finally {
      setMatchesLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-[#051424] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Top Navbar & Bottom Mobile Nav */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedMatch(null);
          setActiveTab(tab);
        }}
        user={user}
        setUser={setUser}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        unreadCount={unreadNotifCount}
      />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:pb-32">
        {selectedMatch ? (
          <MatchCenterView
            match={selectedMatch}
            onBack={() => setSelectedMatch(null)}
            onOpenCatchUp={(m) => setCatchUpMatch(m)}
            onMatchUpdate={(updated) => setSelectedMatch(updated)}
            user={user}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                matches={matches}
                news={news}
                user={user}
                setUser={setUser}
                isLoading={matchesLoading && matches.length === 0}
                onSelectMatch={(m) => setSelectedMatch(m)}
                onOpenCatchUp={(m) => setCatchUpMatch(m)}
                onSelectNews={(n) => {
                  setSelectedNews(n);
                  setActiveTab('news');
                }}
                onNavigateTab={(tab) => {
                  setSelectedMatch(null);
                  setActiveTab(tab);
                }}
              />
            )}

            {activeTab === 'matches' && (
              <MatchesView
                matches={matches}
                user={user}
                onSelectMatch={(m) => setSelectedMatch(m)}
                onOpenCatchUp={(m) => setCatchUpMatch(m)}
                onRefresh={handleRefreshMatches}
                isLoading={matchesLoading}
              />
            )}

            {activeTab === 'alerts' && <AlertsView user={user} setUser={setUser} />}

            {activeTab === 'news' && (
              <NewsFeedView
                news={news}
                user={user}
                setUser={setUser}
                selectedArticle={selectedNews}
                setSelectedArticle={setSelectedNews}
              />
            )}

            {activeTab === 'masterclass' && (
              <MasterclassView user={user} setUser={setUser} />
            )}

            {activeTab === 'profile' && (
              <ProfileView
                user={user}
                setUser={setUser}
                onOpenAuthModal={(scr) => setAuthScreen(scr)}
                onNavigateTab={(tab) => {
                  setSelectedMatch(null);
                  setActiveTab(tab);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* AI Catch-Up Summary Modal */}
      {catchUpMatch && (
        <AICatchUpModal
          isOpen={!!catchUpMatch}
          onClose={() => setCatchUpMatch(null)}
          match={catchUpMatch}
          isDark={isDark}
        />
      )}

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        matches={matches}
        onSelectMatch={(m) => setSelectedMatch(m)}
        isDark={isDark}
      />

      {/* Slide-over Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onClearAll={handleClearNotifications}
        onSelectNotification={handleSelectNotification}
        isDark={isDark}
      />

      {/* Auth & Security Modal */}
      <AuthModal
        screen={authScreen}
        onClose={() => setAuthScreen('none')}
        onNavigate={(scr) => setAuthScreen(scr)}
        isDark={isDark}
      />

      {/* First-Time Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        user={user}
        isDark={isDark}
        onComplete={(teams, players) => {
          setUser((prev) => ({
            ...prev,
            favoriteTeams: teams,
            favoritePlayers: players,
            onboardingCompleted: true,
          }));
          setIsOnboardingOpen(false);
          setActiveTab('home');
        }}
      />

      {/* Floating Gemini AI Chat Widget Launcher */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-40 p-3.5 sm:p-4 rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-white font-bold shadow-2xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group border border-cyan-300/40"
          title="Ask Apex Gemini AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping"></span>
          </div>
          <span className="hidden sm:inline text-xs font-mono font-bold tracking-wider uppercase">
            Ask Gemini AI
          </span>
        </button>
      )}

      {/* Gemini Multi-Turn Context-Aware Chatbot */}
      <GeminiChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
        selectedMatch={selectedMatch}
        isDark={isDark}
      />
    </div>
  );
}

export default App;
