import React from 'react';
import { X, Bell, Zap, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { MatchData } from '../types';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'wicket' | 'raindelay' | 'resume' | 'digest';
  matchId?: string;
  read: boolean;
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onClearAll: () => void;
  onSelectNotification: (notif: NotificationItem) => void;
  isDark: boolean;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onSelectNotification,
  isDark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-md h-full overflow-y-auto p-6 space-y-5 border-l ${
          isDark ? 'bg-[#091b2e] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            <Bell className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
            <span>Match Alerts & Digests</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              className={`text-[11px] font-bold hover:underline ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}
            >
              Clear All
            </button>
            <button onClick={onClose} className={`p-1 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
              <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border ${isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600 font-medium'}`}>
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-bold">No notifications yet</p>
              <p className="text-[11px] mt-1 opacity-75">Alerts and match digests will appear here live during matches.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onSelectNotification(n)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all hover:border-cyan-400/50 space-y-1 ${
                  n.type === 'wicket'
                    ? isDark ? 'bg-red-950/20 border-red-500/30' : 'bg-red-50 border-red-200 shadow-2xs'
                    : n.type === 'raindelay'
                    ? isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200 shadow-2xs'
                    : isDark
                    ? 'bg-slate-800/50 border-slate-700/60'
                    : 'bg-slate-50 border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={`flex items-center gap-1.5 ${
                    n.type === 'wicket'
                      ? 'text-red-600 dark:text-red-400'
                      : n.type === 'raindelay'
                      ? 'text-amber-800 dark:text-amber-400'
                      : n.type === 'resume'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : isDark ? 'text-cyan-400' : 'text-cyan-800'
                  }`}>
                    {n.type === 'wicket' && <Zap className="w-3.5 h-3.5 text-red-500" />}
                    {n.type === 'raindelay' && <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                    {n.type === 'resume' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    {n.type === 'digest' && <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
                    {n.title}
                  </span>
                  <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-bold'}`}>{n.time}</span>
                </div>
                <p className={`text-xs leading-snug ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>{n.body}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
