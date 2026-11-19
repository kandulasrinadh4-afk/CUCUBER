import React from 'react';
import { CheckCircle2, Play, Lock, Clock, ChevronRight } from 'lucide-react';
import { MasterclassLesson } from '../../types';

interface LessonCardProps {
  lesson: MasterclassLesson;
  isCompleted: boolean;
  isLocked?: boolean;
  isActive?: boolean;
  isDark: boolean;
  onSelect: (lesson: MasterclassLesson) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  isCompleted,
  isLocked = false,
  isActive = false,
  isDark,
  onSelect,
}) => {
  return (
    <button
      onClick={() => !isLocked && onSelect(lesson)}
      disabled={isLocked}
      className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 group cursor-pointer ${
        isLocked
          ? isDark
            ? 'bg-slate-900/40 border-slate-800/60 opacity-60 cursor-not-allowed'
            : 'bg-slate-100/50 border-slate-200 opacity-60 cursor-not-allowed'
          : isActive
          ? isDark
            ? 'bg-cyan-950/40 border-cyan-500/50 ring-1 ring-cyan-500/30'
            : 'bg-cyan-50 border-cyan-300 ring-1 ring-cyan-300'
          : isDark
          ? 'bg-[#081b2e]/70 border-slate-800 hover:border-cyan-500/40 hover:bg-[#0b233a]'
          : 'bg-white border-slate-200 hover:border-cyan-300 hover:bg-slate-50 shadow-xs'
      }`}
    >
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
        {/* State Icon Indicator */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            isCompleted
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : isLocked
              ? isDark
                ? 'bg-slate-800 text-slate-500'
                : 'bg-slate-200 text-slate-400'
              : isActive
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
              : isDark
              ? 'bg-slate-800 text-cyan-400 border border-slate-700 group-hover:bg-cyan-500 group-hover:text-slate-950'
              : 'bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-cyan-500 group-hover:text-slate-950 font-bold'
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : isLocked ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Play className={`w-4 h-4 ${isActive ? 'fill-slate-950' : 'group-hover:fill-slate-950'}`} />
          )}
        </div>

        {/* Lesson Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                isCompleted
                  ? 'text-emerald-400'
                  : isDark
                  ? 'text-slate-400'
                  : 'text-slate-500'
              }`}
            >
              Lesson {lesson.order}
            </span>
            {lesson.subSection && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {lesson.subSection}
              </span>
            )}
            {lesson.difficulty && (
              <span
                className={`hidden xs:inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                  lesson.difficulty === 'Beginner'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : lesson.difficulty === 'Intermediate'
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'bg-purple-500/10 text-purple-400'
                }`}
              >
                {lesson.difficulty}
              </span>
            )}
          </div>
          <h4
            className={`font-bold text-sm sm:text-base truncate transition-colors ${
              isCompleted
                ? isDark
                  ? 'text-slate-200'
                  : 'text-slate-800'
                : isDark
                ? 'text-white group-hover:text-cyan-300'
                : 'text-slate-900 group-hover:text-cyan-600'
            }`}
          >
            {lesson.title}
          </h4>
        </div>
      </div>

      {/* Right Side Info & Action */}
      <div className="flex items-center gap-3 shrink-0">
        <div className={`hidden sm:flex items-center gap-1 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{lesson.durationMin}m</span>
        </div>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1 ${
            isDark ? 'text-slate-400 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-900'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
};
