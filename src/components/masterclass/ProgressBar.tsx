import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'emerald' | 'amber' | 'blue';
  showLabel?: boolean;
  label?: string;
  isDark?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  size = 'md',
  color = 'cyan',
  showLabel = false,
  label,
  isDark = true,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  const colorGradients = {
    cyan: 'from-cyan-500 to-teal-400',
    emerald: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-orange-400',
    blue: 'from-blue-500 to-cyan-400',
  }[color];

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{label || 'Progress'}</span>
          <span className={`font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
            {clampedValue}%
          </span>
        </div>
      )}
      <div
        className={`w-full rounded-full overflow-hidden ${heightClasses} ${
          isDark ? 'bg-slate-800/80 border border-slate-700/50' : 'bg-slate-200/80 border border-slate-300/60'
        }`}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorGradients} transition-all duration-500 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
