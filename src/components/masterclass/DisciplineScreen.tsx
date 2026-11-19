import React from 'react';
import { ArrowLeft, Sparkles, CheckCircle2, Award } from 'lucide-react';
import { MasterclassDiscipline, MasterclassLesson, MasterclassModule } from '../../types';
import { ModuleCard } from './ModuleCard';
import { ProgressBar } from './ProgressBar';

interface DisciplineScreenProps {
  discipline: MasterclassDiscipline;
  modules: MasterclassModule[];
  completedLessonIds: string[];
  activeLessonId?: string | null;
  isDark: boolean;
  onBack: () => void;
  onSelectLesson: (lesson: MasterclassLesson) => void;
}

export const DisciplineScreen: React.FC<DisciplineScreenProps> = ({
  discipline,
  modules,
  completedLessonIds,
  activeLessonId,
  isDark,
  onBack,
  onSelectLesson,
}) => {
  const isBatting = discipline === 'batting';
  const allLessons = modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const headerTitle = isBatting ? 'Batting Masterclass' : 'Bowling Masterclass';
  const headerSubtitle = isBatting
    ? 'Build your batting from the fundamentals to advanced match skills.'
    : 'Build your action, control and bowling variations.';
  const disciplineEmoji = isBatting ? '🏏' : '🎯';

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              : 'bg-white border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-100 shadow-xs'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Masterclass Home</span>
        </button>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          {disciplineEmoji} {modules.length} Modules · {totalLessons} Lessons
        </span>
      </div>

      {/* Hero Header & Overall Progress Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#082038] via-[#051424] to-[#030d17] border-cyan-500/30'
            : 'bg-gradient-to-br from-white via-cyan-50/50 to-teal-50/40 border-cyan-200'
        }`}
      >
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">{disciplineEmoji}</span>
            <div>
              <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {headerTitle}
              </h1>
              <p className={`text-sm sm:text-base mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {headerSubtitle}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pt-2">
            <div className="flex justify-between items-center text-xs font-mono font-bold mb-1.5">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                {isBatting ? 'Batting' : 'Bowling'} Overall Mastery
              </span>
              <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>
                {completedCount} / {totalLessons} Lessons ({percentage}%)
              </span>
            </div>
            <ProgressBar
              value={percentage}
              size="md"
              color={percentage === 100 ? 'emerald' : 'cyan'}
              isDark={isDark}
            />
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Training Modules
          </h2>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Click any module to expand
          </span>
        </div>

        <div className="space-y-4">
          {modules.map((mod, index) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              completedLessonIds={completedLessonIds}
              activeLessonId={activeLessonId}
              isDark={isDark}
              onSelectLesson={onSelectLesson}
              defaultExpanded={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
