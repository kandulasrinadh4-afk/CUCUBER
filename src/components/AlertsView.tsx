import React, { useState } from 'react';
import {
  Bell,
  Volume2,
  ShieldAlert,
  Sparkles,
  Zap,
  CheckCircle2,
  Radio,
  Sliders,
  AlertCircle,
  Play,
  Check,
  Smartphone,
  Vibrate,
} from 'lucide-react';
import { UserProfile, AlertPreferences } from '../types';
import { DEFAULT_USER } from '../data/mockData';
import { auth } from '../lib/firebase';
import { updateUserPreferences } from '../services/userService';

interface AlertsViewProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ user, setUser }) => {
  const [activePreview, setActivePreview] = useState<string | null>(null);

  const isDark = user.theme === 'dark';
  const prefs = user.preferences || DEFAULT_USER.preferences;
  const events = prefs.events || DEFAULT_USER.preferences.events;

  const updatePreset = (preset: AlertPreferences['preset']) => {
    let newEvents = { ...events };
    if (preset === 'essential') {
      newEvents = {
        matchStart: true,
        toss: false,
        matchResult: true,
        wicket: true,
        halfCentury: false,
        century: true,
        boundaries: false,
        rainDelay: true,
        playResumed: true,
        criticalOvers: true,
      };
    } else if (preset === 'balanced') {
      newEvents = {
        matchStart: true,
        toss: true,
        matchResult: true,
        wicket: true,
        halfCentury: true,
        century: true,
        boundaries: false,
        rainDelay: true,
        playResumed: true,
        criticalOvers: true,
      };
    } else if (preset === 'everything') {
      newEvents = {
        matchStart: true,
        toss: true,
        matchResult: true,
        wicket: true,
        halfCentury: true,
        century: true,
        boundaries: true,
        rainDelay: true,
        playResumed: true,
        criticalOvers: true,
      };
    }

    setUser((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        preset,
        events: newEvents,
      },
    }));

    if (auth.currentUser?.uid) {
      updateUserPreferences(auth.currentUser.uid, {
        defaultAlertPreset: (preset === 'custom' ? 'balanced' : preset) as any,
        notificationPreferences: {
          wickets: newEvents.wicket,
          milestones: newEvents.century,
          rainDelays: newEvents.rainDelay,
          inningsBreak: true,
          matchResult: newEvents.matchResult,
          hourlyDigest: true,
          sound: user.preferences?.soundEnabled ?? true,
          boundaries: newEvents.boundaries,
        },
      }).catch((err) => console.warn('Could not sync alert preset to Firestore:', err));
    }
  };

  const toggleEvent = (key: keyof AlertPreferences['events']) => {
    const currentEvents = user.preferences?.events || DEFAULT_USER.preferences.events;
    const updatedEvents = {
      ...currentEvents,
      [key]: !currentEvents[key],
    };

    setUser((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        preset: 'custom',
        events: updatedEvents,
      },
    }));

    if (auth.currentUser?.uid) {
      updateUserPreferences(auth.currentUser.uid, {
        notificationPreferences: {
          wickets: updatedEvents.wicket,
          milestones: updatedEvents.century,
          rainDelays: updatedEvents.rainDelay,
          inningsBreak: true,
          matchResult: updatedEvents.matchResult,
          hourlyDigest: true,
          sound: user.preferences?.soundEnabled ?? true,
          boundaries: updatedEvents.boundaries,
        },
      }).catch((err) => console.warn('Could not sync alert event to Firestore:', err));
    }
  };

  const playAlertSound = (soundText: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      if (soundText.toLowerCase().includes('siren') || soundText.toLowerCase().includes('wicket')) {
        // Custom Wicket Siren: dual-tone frequency modulation
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.linearRampToValueAtTime(950, now + 0.25);
        osc.frequency.linearRampToValueAtTime(650, now + 0.5);
        osc.frequency.linearRampToValueAtTime(950, now + 0.75);
        osc.frequency.linearRampToValueAtTime(650, now + 1.0);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.1);
      } else {
        // Bell / Chime tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  const triggerPreview = (eventTitle: string, soundText: string) => {
    setActivePreview(`${eventTitle}: ${soundText}`);
    playAlertSound(soundText);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // Ignore vibration errors
      }
    }
    setTimeout(() => setActivePreview(null), 3000);
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Alert Sound Test Flash Notification */}
      {activePreview && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-3 border border-cyan-300 animate-bounce max-w-md">
          <Volume2 className="w-5 h-5 shrink-0 animate-pulse" />
          <div>
            <p className="font-extrabold text-sm">ALERT SOUND TEST</p>
            <p className="text-[11px] font-normal">{activePreview}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="space-y-1">
        <div className={`flex items-center gap-2 text-xs font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
          <Bell className="w-4 h-4" />
          <span>SMART NOTIFICATION ENGINE</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Notification & Alert Rules</h1>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
          Tailor real-time push triggers, sound alerts, and busy mode behavior for all live matches.
        </p>
      </div>

      {/* Alert Presets Grid */}
      <div className="space-y-3">
        <label className={`block text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'}`}>
          1. Select Alert Preset:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'essential', title: 'Essential', desc: 'Wickets, Results & Rain' },
            { id: 'balanced', title: 'Balanced', desc: 'Milestones & Key Overs' },
            { id: 'everything', title: 'Everything', desc: 'Boundaries & Every Ball' },
            { id: 'custom', title: 'Custom', desc: 'Tailored event rules' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => updatePreset(p.id as any)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                prefs.preset === p.id
                  ? isDark
                    ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-cyan-100 border-cyan-400 text-cyan-950 font-extrabold shadow-xs'
                  : isDark
                  ? 'bg-[#091b2e] border-slate-800 text-slate-300 hover:border-slate-700'
                  : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400 shadow-2xs font-bold'
              }`}
            >
              {prefs.preset === p.id && (
                <Check className={`w-4 h-4 absolute top-3 right-3 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              )}
              <h4 className="font-bold text-xs">{p.title}</h4>
              <p className={`text-[10px] mt-0.5 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Busy Mode Toggle Card */}
      <div
        className={`p-5 rounded-3xl border ${
          isDark
            ? 'bg-gradient-to-r from-amber-950/20 via-slate-900 to-amber-950/20 border-amber-500/30'
            : 'bg-amber-50/90 border-amber-300 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Busy Mode (Hourly Silent Digest)</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                Consolidates live alerts into a clean summary every 30-60 mins during meetings.
              </p>
            </div>
          </div>
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
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0 focus:outline-none ${
              prefs.busyMode ? 'bg-amber-500' : 'bg-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white absolute top-0.5 left-0.5 transition-transform shadow-xs pointer-events-none ${
                prefs.busyMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Global Notification Output Channels */}
      <div
        className={`p-5 rounded-3xl border space-y-3 ${
          isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700 font-extrabold'}`}>
          2. Delivery Channels & Preferences
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <Smartphone className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <span className="font-bold text-xs">Push Notifications</span>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-400 bg-slate-100 border-slate-300"
            />
          </div>

          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <Volume2 className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <span className="font-bold text-xs">Audio Sirens / Chimes</span>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-400 bg-slate-100 border-slate-300"
            />
          </div>

          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <Vibrate className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <span className="font-bold text-xs">Device Haptics</span>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-400 bg-slate-100 border-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Category 1: Batting & Wickets */}
      <div
        className={`p-5 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
            <h3 className="font-bold text-sm">3. Batting & Wicket Triggers</h3>
          </div>
          <button
            onClick={() => triggerPreview('Wicket Alert', '🔊 Custom Wicket Siren + Vibration')}
            className={`text-xs font-bold hover:underline flex items-center gap-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}
          >
            <Play className="w-3 h-3" /> Test Sound
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'wicket', title: 'Wicket Fallen', desc: 'Instant siren on any dismissal' },
            { key: 'halfCentury', title: '50 Runs Milestone', desc: 'Alert when batter reaches 50' },
            { key: 'century', title: '100 Runs Century', desc: 'Special celebration chime on 100' },
            { key: 'boundaries', title: 'Boundaries (4s & 6s)', desc: 'Notify on every 4 or 6' },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => toggleEvent(item.key as any)}
              className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                isDark
                  ? 'bg-slate-800/40 border-slate-700/50 hover:border-cyan-500/40'
                  : 'bg-slate-50 border-slate-200 hover:border-cyan-500/50 shadow-2xs'
              }`}
            >
              <div>
                <span className="font-bold text-xs block">{item.title}</span>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>{item.desc}</span>
              </div>
              <input
                type="checkbox"
                checked={item.key === 'boundaries' ? Boolean(events.boundaries) : (events[item.key as keyof typeof events] ?? true)}
                onChange={() => {}}
                className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-400 bg-slate-100 border-slate-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Category 2: Weather & Interruptions */}
      <div
        className={`p-5 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm">4. Weather & Match Interruptions</h3>
          </div>
          <button
            onClick={() => triggerPreview('Play Resumed', '🔔 Play Resumed Bell + Scoreboard Flash')}
            className={`text-xs font-bold hover:underline flex items-center gap-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}
          >
            <Play className="w-3 h-3" /> Test Sound
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'rainDelay', title: 'Rain Delay Stopped Play', desc: 'Alert when covers come out' },
            { key: 'playResumed', title: 'Play Resumed Alert', desc: 'Notify when players walk back on field' },
            { key: 'criticalOvers', title: 'Final 5 Critical Overs', desc: 'Alert at start of tight chases' },
            { key: 'matchResult', title: 'Match Result Summary', desc: 'Instant post-match scorecard alert' },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => toggleEvent(item.key as any)}
              className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                isDark
                  ? 'bg-slate-800/40 border-slate-700/50 hover:border-cyan-500/40'
                  : 'bg-slate-50 border-slate-200 hover:border-cyan-500/50 shadow-2xs'
              }`}
            >
              <div>
                <span className="font-bold text-xs block">{item.title}</span>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>{item.desc}</span>
              </div>
              <input
                type="checkbox"
                checked={events[item.key as keyof typeof events] ?? true}
                onChange={() => {}}
                className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-400 bg-slate-100 border-slate-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
