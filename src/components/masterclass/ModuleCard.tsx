import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Lock, BookOpen, Layers } from 'lucide-react';
import { MasterclassModule, MasterclassLesson } from '../../types';
import { ProgressBar } from './ProgressBar';
import { LessonCard } from './LessonCard';

interface ModuleCardProps {
  module: MasterclassModule;
  completedLessonIds: string[];
  activeLessonId?: string | null;
  isDark: boolean;
  onSelectLesson: (lesson: MasterclassLesson) => void;
  defaultExpanded?: boolean;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  completedLessonIds,
  activeLessonId,
  isDark,
  onSelectLesson,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const completedCount = module.lessons.filter((l) =>
    completedLessonIds.includes(l.id)
  ).length;
  const totalCount = module.lessons.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isModuleCompleted = completedCount === totalCount && totalCount > 0;

  // Group lessons by subSection if any exist (e.g. Spin Bowling -> Off Spin, Leg Spin)
  const hasSubSections = !!module.subSections && module.subSections.length > 0;

  return (
    <div
      className={`rounded-3xl border transition-all overflow-hidden ${
        isDark
          ? 'bg-[#06182a]/90 border-slate-800 shadow-xl shadow-black/20'
          : 'bg-white border-slate-200 shadow-md shadow-slate-200/50'
      }`}
    >
      {/* Module Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
          isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
        }`}
      >
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              {module.title.split('—')[0]?.trim() || `Module ${module.order}`}
            </span>
            {isModuleCompleted && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle className="w-3 h-3" />
                Completed
              </span>
            )}
          </div>
          <h3 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {module.title.includes('—') ? module.title.split('—')[1]?.trim() : module.title}
          </h3>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {module.description}
          </p>
        </div>

        {/* Progress & Toggle */}
        <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
          <div className="w-32 sm:w-36">
            <div className="flex justify-between items-center text-xs font-mono font-bold mb-1">
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                {completedCount}/{totalCount} lessons
              </span>
              <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>{percentage}%</span>
            </div>
            <ProgressBar
              value={percentage}
              size="sm"
              color={isModuleCompleted ? 'emerald' : 'cyan'}
              isDark={isDark}
            />
          </div>

          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300'
                : 'border-slate-300 bg-slate-100 text-slate-700'
            }`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expandable Lesson List */}
      {isExpanded && (
        <div className={`p-4 sm:p-6 pt-0 border-t ${isDark ? 'border-slate-800/80 bg-slate-950/20' : 'border-slate-100 bg-slate-50/40'}`}>
          {hasSubSections ? (
            <div className="space-y-6 pt-4">
              {module.subSections!.map((subSec) => {
                const subLessons = module.lessons.filter((l) => l.subSection === subSec);
                return (
                  <div key={subSec} className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-dashed border-slate-700/60">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-cyan-400">
                        {subSec}
                      </h4>
                      <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        ({subLessons.filter((l) => completedLessonIds.includes(l.id)).length}/{subLessons.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {subLessons.map((lesson) => (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          isCompleted={completedLessonIds.includes(lesson.id)}
                          isActive={activeLessonId === lesson.id}
                          isDark={isDark}
                          onSelect={onSelectLesson}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 pt-4">
              {module.lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  isCompleted={completedLessonIds.includes(lesson.id)}
                  isActive={activeLessonId === lesson.id}
                  isDark={isDark}
                  onSelect={onSelectLesson}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
