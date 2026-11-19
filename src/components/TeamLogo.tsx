import React, { useState } from 'react';

interface TeamLogoProps {
  logo?: string;
  name: string;
  shortName?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'w-5 h-5 text-xs',
  sm: 'w-7 h-7 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
  xl: 'w-18 h-18 text-2xl',
};

// Distinctive color palettes for cricket teams
const teamColors: Record<string, { bg: string; text: string; border: string }> = {
  IND: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-400' },
  AUS: { bg: 'bg-amber-400', text: 'text-slate-900', border: 'border-amber-500' },
  ENG: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-400' },
  PAK: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-400' },
  NZ: { bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-600' },
  SA: { bg: 'bg-green-700', text: 'text-amber-300', border: 'border-amber-400' },
  RCB: { bg: 'bg-red-700', text: 'text-amber-300', border: 'border-amber-400' },
  CSK: { bg: 'bg-yellow-400', text: 'text-blue-900', border: 'border-yellow-500' },
  MI: { bg: 'bg-blue-700', text: 'text-amber-300', border: 'border-blue-400' },
  KKR: { bg: 'bg-purple-800', text: 'text-amber-300', border: 'border-purple-400' },
  GT: { bg: 'bg-slate-800', text: 'text-cyan-300', border: 'border-cyan-500' },
  SRH: { bg: 'bg-orange-600', text: 'text-slate-950', border: 'border-orange-400' },
  DC: { bg: 'bg-blue-600', text: 'text-red-400', border: 'border-blue-400' },
  RR: { bg: 'bg-pink-600', text: 'text-blue-900', border: 'border-pink-400' },
  LSG: { bg: 'bg-cyan-600', text: 'text-orange-400', border: 'border-cyan-400' },
  PBKS: { bg: 'bg-red-600', text: 'text-amber-300', border: 'border-red-400' },
};

export const TeamLogo: React.FC<TeamLogoProps> = ({
  logo,
  name,
  shortName,
  className = '',
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);

  const isUrl =
    typeof logo === 'string' &&
    (logo.startsWith('http://') ||
      logo.startsWith('https://') ||
      logo.startsWith('/') ||
      logo.startsWith('data:image'));

  const shortCode = (shortName || name.slice(0, 3)).toUpperCase();
  const colorTheme = teamColors[shortCode] || {
    bg: 'bg-slate-700',
    text: 'text-cyan-300',
    border: 'border-slate-600',
  };

  if (isUrl && !hasError) {
    return (
      <div
        className={`relative shrink-0 rounded-2xl overflow-hidden bg-slate-800 border border-white/10 shadow-sm flex items-center justify-center ${
          sizeClasses[size]
        } ${className}`}
      >
        <img
          src={logo}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // If it's a short emoji flag (e.g. 🇮🇳, 🇦🇺)
  if (logo && logo.length <= 4 && !isUrl) {
    return (
      <div
        className={`shrink-0 rounded-2xl flex items-center justify-center bg-slate-800/80 border border-slate-700 shadow-sm select-none ${
          sizeClasses[size]
        } ${className}`}
      >
        <span className="leading-none">{logo}</span>
      </div>
    );
  }

  // Fallback badge with team initials and vibrant franchise color
  return (
    <div
      className={`shrink-0 rounded-2xl flex items-center justify-center font-black tracking-wider shadow-sm border select-none ${colorTheme.bg} ${colorTheme.text} ${colorTheme.border} ${sizeClasses[size]} ${className}`}
      title={name}
    >
      <span className="leading-none text-center font-mono font-black scale-90">
        {shortCode.slice(0, 3)}
      </span>
    </div>
  );
};
