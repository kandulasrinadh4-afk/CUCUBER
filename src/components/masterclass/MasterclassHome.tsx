import React from 'react';
import { ArrowRight, Sparkles, Trophy, BookOpen, ChevronRight, Zap } from 'lucide-react';
import { MasterclassLesson, MasterclassDiscipline } from '../../types';
import { ProgressBar } from './ProgressBar';
import { ContinueLearningCard } from './ContinueLearningCard';
import { LessonCard } from './LessonCard';
import {
  TOTAL_BATTING_LESSONS,
  TOTAL_BOWLING_LESSONS,
  TOTAL_MASTERCLASS_LESSONS,
} from '../../data/masterclassData';

interface MasterclassHomeProps {
  completedLessonIds: string[];
  activeLesson: MasterclassLesson | null;
  overallCompletionPercent: number;
  recommendedLessons: MasterclassLesson[];
  isDark: boolean;
  onSelectDiscipline: (discipline: MasterclassDiscipline) => void;
  onSelectLesson: (lesson: MasterclassLesson) => void;
  onStartFirstLesson: () => void;
}

export const MasterclassHome: React.FC<MasterclassHomeProps> = ({
  completedLessonIds,
  activeLesson,
  overallCompletionPercent,
  recommendedLessons,
  isDark,
  onSelectDiscipline,
  onSelectLesson,
  onStartFirstLesson,
}) => {
  // Compute dynamic counts based on completedLessonIds
  const completedBattingCount = completedLessonIds.filter((id) => id.startsWith('bat-')).length;
  const completedBowlingCount = completedLessonIds.filter((id) => id.startsWith('bowl-')).length;
  const totalCompleted = completedLessonIds.length;

  const battingPercent = Math.round((completedBattingCount / TOTAL_BATTING_LESSONS) * 100);
  const bowlingPercent = Math.round((completedBowlingCount / TOTAL_BOWLING_LESSONS) * 100);
  const overallPercent = overallCompletionPercent ?? Math.round((totalCompleted / TOTAL_MASTERCLASS_LESSONS) * 100);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* 1. Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>CUCUBER Pro Training Academy</span>
        </div>
        <h1 className={`text-3xl sm:text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Masterclass
        </h1>
        <p className={`text-base sm:text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Train smarter. Play better.
        </p>
      </div>

      {/* 2. Continue Learning Card */}
      <section>
        <ContinueLearningCard
          activeLesson={activeLesson}
          completionPercentage={overallPercent}
          totalCompletedCount={totalCompleted}
          isDark={isDark}
          onContinue={onSelectLesson}
          onStartFirst={onStartFirstLesson}
        />
      </section>

      {/* 3. Choose Your Discipline */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Choose Your Discipline
          </h2>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            2 Specialization Tracks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Batting Card */}
          <div
            className={`group rounded-3xl p-6 sm:p-8 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-xl ${
              isDark
                ? 'bg-gradient-to-br from-[#0c243d] via-[#07192b] to-[#04101e] border-cyan-500/30 hover:border-cyan-400 shadow-cyan-950/30'
                : 'bg-gradient-to-br from-white via-cyan-50/40 to-teal-50/30 border-cyan-200 hover:border-cyan-400 shadow-cyan-900/5'
            }`}
          >
            {/* Top Badge & Icon */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-3xl flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:scale-110 transition-transform">
                  🏏
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {TOTAL_BATTING_LESSONS} Lessons · 5 Modules
                </span>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                  DISCIPLINE 01
                </span>
                <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Batting Masterclass
                </h3>
                <p className={`text-sm sm:text-base mt-2 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Master your technique, timing and shot selection.
                </p>
              </div>

              {/* Mini progress bar */}
              <div className="pt-2">
                <div className="flex justify-between text-xs font-mono font-bold mb-1">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                    Completed: {completedBattingCount} / {TOTAL_BATTING_LESSONS}
                  </span>
                  <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>{battingPercent}%</span>
                </div>
                <ProgressBar value={battingPercent} size="sm" color="cyan" isDark={isDark} />
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => onSelectDiscipline('batting')}
                className="w-full py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Start Learning</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bowling Card */}
          <div
            className={`group rounded-3xl p-6 sm:p-8 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-xl ${
              isDark
                ? 'bg-gradient-to-br from-[#122238] via-[#091829] to-[#04101e] border-teal-500/30 hover:border-teal-400 shadow-teal-950/30'
                : 'bg-gradient-to-br from-white via-teal-50/40 to-emerald-50/30 border-teal-200 hover:border-teal-400 shadow-teal-900/5'
            }`}
          >
            {/* Top Badge & Icon */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-3xl flex items-center justify-center shadow-lg shadow-teal-500/10 group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/30">
                  {TOTAL_BOWLING_LESSONS} Lessons · 4 Modules
                </span>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-teal-400">
                  DISCIPLINE 02
                </span>
                <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Bowling Masterclass
                </h3>
                <p className={`text-sm sm:text-base mt-2 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Build your action, control and bowling variations.
                </p>
              </div>

              {/* Mini progress bar */}
              <div className="pt-2">
                <div className="flex justify-between text-xs font-mono font-bold mb-1">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                    Completed: {completedBowlingCount} / {TOTAL_BOWLING_LESSONS}
                  </span>
                  <span className={isDark ? 'text-teal-400' : 'text-teal-600'}>{bowlingPercent}%</span>
                </div>
                <ProgressBar value={bowlingPercent} size="sm" color="emerald" isDark={isDark} />
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => onSelectDiscipline('bowling')}
                className="w-full py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 text-slate-950 shadow-md shadow-teal-500/20 group-hover:shadow-teal-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Start Learning</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Your Training Progress */}
      <section
        className={`p-6 sm:p-8 rounded-3xl border shadow-xl transition-all ${
          isDark
            ? 'bg-[#06182a]/90 border-slate-800'
            : 'bg-white border-slate-200 shadow-slate-200/60'
        }`}
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Your Progress
              </h2>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Dynamic masterclass mastery tracked in real-time.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {totalCompleted} / {TOTAL_MASTERCLASS_LESSONS} Total Completed ({overallPercent}%)
              </span>
            </div>
          </div>

          {/* Overall master bar */}
          <div>
            <ProgressBar
              value={overallPercent}
              size="lg"
              color={overallPercent === 100 ? 'emerald' : 'cyan'}
              isDark={isDark}
            />
          </div>

          {/* Detailed discipline counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Batting Stat */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-lg">
                  🏏
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Batting
                  </h4>
                  <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {completedBattingCount} / {TOTAL_BATTING_LESSONS} total lessons
                  </p>
                </div>
              </div>
              <span className={`font-mono text-base font-black ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {battingPercent}%
              </span>
            </div>

            {/* Bowling Stat */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-lg">
                  🎯
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Bowling
                  </h4>
                  <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {completedBowlingCount} / {TOTAL_BOWLING_LESSONS} total lessons
                  </p>
                </div>
              </div>
              <span className={`font-mono text-base font-black ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                {bowlingPercent}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Recommended For You */}
      {recommendedLessons.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Recommended For You
              </h2>
            </div>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Targeted Next Steps
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                isCompleted={completedLessonIds.includes(lesson.id)}
                isDark={isDark}
                onSelect={onSelectLesson}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
