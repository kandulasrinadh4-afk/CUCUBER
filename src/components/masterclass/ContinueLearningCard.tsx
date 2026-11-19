import React from 'react';
import { ArrowRight, Play, Sparkles, BookOpen } from 'lucide-react';
import { MasterclassLesson } from '../../types';
import { ProgressBar } from './ProgressBar';
import { TOTAL_MASTERCLASS_LESSONS } from '../../data/masterclassData';

interface ContinueLearningCardProps {
  activeLesson: MasterclassLesson | null;
  completionPercentage: number;
  totalCompletedCount?: number;
  isDark: boolean;
  onContinue: (lesson: MasterclassLesson) => void;
  onStartFirst: () => void;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  activeLesson,
  completionPercentage,
  totalCompletedCount = 0,
  isDark,
  onContinue,
  onStartFirst,
}) => {
  // NEW USER / NO MASTERCLASS PROGRESS
  if (!activeLesson) {
    return (
      <div
        id="continue-learning-card"
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border transition-all shadow-xl ${
          isDark
            ? 'bg-gradient-to-br from-[#0a233d] via-[#06182a] to-[#04101d] border-cyan-500/30 text-white shadow-cyan-950/40'
            : 'bg-gradient-to-br from-white via-cyan-50/50 to-teal-50/40 border-cyan-200 text-slate-900 shadow-cyan-900/5'
        }`}
      >
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended: Grip</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Start Your First Lesson
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Begin with the fundamentals.
            </p>
          </div>

          <button
            id="start-first-lesson-btn"
            onClick={onStartFirst}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Start Learning</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // RETURNING USER WITH PROGRESS
  const disciplineIcon = activeLesson.discipline === 'batting' ? '🏏' : '🎯';
  const isAllCompleted = completionPercentage >= 100;

  return (
    <div
      id="continue-learning-card"
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border transition-all shadow-xl ${
        isDark
          ? 'bg-gradient-to-br from-[#0b2744] via-[#071d33] to-[#041220] border-cyan-500/30 text-white shadow-cyan-950/50'
          : 'bg-gradient-to-br from-white via-cyan-50/60 to-emerald-50/40 border-cyan-200 text-slate-900 shadow-cyan-900/10'
      }`}
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl w-full">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Continue Learning</span>
            </span>
            <span className={`text-xs font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {activeLesson.moduleTitle}
            </span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <span>{disciplineIcon}</span>
              <span>{activeLesson.title}</span>
            </h3>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Lesson {activeLesson.order} · {activeLesson.durationMin} mins practice
            </p>
          </div>

          <div className="pt-2 max-w-md">
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                Masterclass Progress ({totalCompletedCount}/{TOTAL_MASTERCLASS_LESSONS})
              </span>
              <span className={`font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {completionPercentage}%
              </span>
            </div>
            <ProgressBar
              value={completionPercentage}
              size="md"
              color={isAllCompleted ? 'emerald' : 'cyan'}
              isDark={isDark}
            />
          </div>
        </div>

        <button
          id="continue-learning-btn"
          onClick={() => onContinue(activeLesson)}
          className="w-full md:w-auto px-7 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
