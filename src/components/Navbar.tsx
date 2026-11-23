import React from 'react';
import { Radio, Bell, Search, User, Moon, Sun, ShieldAlert, Sparkles, Flame } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: 'home' | 'matches' | 'alerts' | 'news' | 'masterclass' | 'profile';
  setActiveTab: (tab: 'home' | 'matches' | 'alerts' | 'news' | 'masterclass' | 'profile') => void;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  setUser,
  onOpenSearch,
  onOpenNotifications,
  unreadCount,
}) => {
  const toggleTheme = () => {
    setUser((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const isDark = user.theme === 'dark';

  const navItems: Array<{
    id: 'home' | 'matches' | 'alerts' | 'news' | 'masterclass' | 'profile';
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'home', label: 'Home', icon: <Radio className="w-4 h-4 shrink-0" /> },
    { id: 'matches', label: 'Matches', icon: <Sparkles className="w-4 h-4 shrink-0" /> },
    { id: 'masterclass', label: 'Masterclass', icon: <span className="text-xs leading-none shrink-0">🏏</span> },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="w-4 h-4 shrink-0" /> },
    { id: 'news', label: 'News', icon: <Flame className="w-4 h-4 shrink-0" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <>
      {/* 1. TOP UTILITY HEADER */}
      <header
        className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-[#051424]/90 border-slate-800/80 text-white'
            : 'bg-white/90 border-slate-200 text-slate-900 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* App Branding */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('home')}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 text-slate-950 font-black shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-wider font-mono bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  CUCUBER
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sports Intelligence
              </p>
            </div>
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Busy Mode Pill */}
            <button
              onClick={() =>
                setUser((prev) => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    busyMode: !prev.preferences.busyMode,
                  },
                }))
              }
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                user.preferences.busyMode
                  ? isDark
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-xs'
                    : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                  : isDark
                  ? 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-950 hover:bg-slate-200 font-bold'
              }`}
              title="Busy Mode aggregates notifications into hourly silent digests"
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">
                {user.preferences.busyMode ? 'Busy Mode ON' : 'Busy Mode OFF'}
              </span>
              <span className="xs:hidden sm:hidden text-[10px] uppercase font-bold">
                {user.preferences.busyMode ? 'Busy' : 'Normal'}
              </span>
            </button>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-cyan-400 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-300 text-amber-700 hover:bg-slate-200 font-bold'
              }`}
              title="Toggle Dark/Light Mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Search Button */}
            <button
              onClick={onOpenSearch}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-950 font-bold'
              }`}
              title="Search matches and teams"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className={`relative p-2 sm:p-2.5 rounded-xl border transition-all ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-950 font-bold'
              }`}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center p-0.5 rounded-full border transition-all ${
                activeTab === 'profile'
                  ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                  : isDark
                  ? 'border-slate-700 hover:border-slate-500'
                  : 'border-slate-300 hover:border-slate-500'
              }`}
              title="View Profile"
            >
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={user.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                }}
                className="w-8 h-8 rounded-full object-cover"
              />
            </button>
          </div>
        </div>
      </header>

      {/* 2. FLOATING PRIMARY NAVIGATION (POSITIONED AT BOTTOM CENTER OF VIEWPORT) */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 px-3 w-full max-w-fit pointer-events-none">
        <nav
          className={`pointer-events-auto mx-auto p-1.5 sm:p-2 rounded-full border backdrop-blur-xl transition-all shadow-2xl ${
            isDark
              ? 'bg-[#091b2e]/90 border-slate-700/80 text-white shadow-black/60 ring-1 ring-white/10'
              : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-400/30 ring-1 ring-slate-900/5'
          }`}
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-bold'
                  }`}
                >
                  {item.icon}
                  <span className="text-[11px] sm:text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};
