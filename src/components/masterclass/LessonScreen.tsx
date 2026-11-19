import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Target,
  Dumbbell,
  Check,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Clock,
  Repeat,
  Compass,
} from 'lucide-react';
import { MasterclassLesson } from '../../types';
import { ProgressBar } from './ProgressBar';

interface LessonScreenProps {
  lesson: MasterclassLesson;
  isCompleted: boolean;
  totalLessonsInDiscipline: number;
  disciplineLessonIndex: number;
  isDark: boolean;
  nextLessonTitle?: string;
  onBack: () => void;
  onToggleComplete: (lessonId: string) => void;
  onNextLesson?: () => void;
  onPrevLesson?: () => void;
  hasNextLesson: boolean;
  hasPrevLesson: boolean;
}

export const LessonScreen: React.FC<LessonScreenProps> = ({
  lesson,
  isCompleted,
  totalLessonsInDiscipline,
  disciplineLessonIndex,
  isDark,
  nextLessonTitle,
  onBack,
  onToggleComplete,
  onNextLesson,
  onPrevLesson,
  hasNextLesson,
  hasPrevLesson,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAngle, setActiveAngle] = useState<'Side-On' | 'Front-On' | 'Bird-Eye'>('Side-On');
  const [playbackSpeed, setPlaybackSpeed] = useState<'1.0x' | '0.5x Slow-Mo'>('1.0x');
  const [isPracticeCompleted, setIsPracticeCompleted] = useState(false);

  const disciplineEmoji = lesson.discipline === 'batting' ? '🏏' : '🎯';
  const progressPercent = Math.round(((disciplineLessonIndex + 1) / totalLessonsInDiscipline) * 100);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Lesson Header / Breadcrumbs */}
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
          <span>Back to {lesson.discipline === 'batting' ? 'Batting Masterclass' : 'Bowling Masterclass'}</span>
        </button>

        {/* Next / Prev Navigation quick buttons */}
        <div className="flex items-center gap-2">
          {hasPrevLesson && (
            <button
              onClick={onPrevLesson}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Previous Lesson"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {hasNextLesson && (
            <button
              onClick={onNextLesson}
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Next Lesson"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lesson Title & Module Meta */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            {disciplineEmoji} {lesson.discipline.toUpperCase()}
          </span>
          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Lesson {lesson.order} · {lesson.moduleTitle}
          </span>
          {lesson.difficulty && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              {lesson.difficulty}
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Lesson Complete ✓
            </span>
          )}
        </div>
        <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {lesson.title}
        </h1>
      </div>

      {/* 2. Video / Media Placeholder */}
      <div
        className={`relative overflow-hidden rounded-3xl border shadow-2xl transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#06182a] via-[#04101e] to-[#020912] border-slate-700/80 shadow-cyan-950/40'
            : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-slate-800 text-white shadow-xl'
        }`}
      >
        {/* Visual Training Stage / Pitch Graphics */}
        <div className="relative aspect-video max-h-[460px] w-full flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
          {/* Simulated pitch vector background grid */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cricket-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cricket-grid)" />
            </svg>
          </div>

          {/* Central Animated Cricket Visual Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-cyan-500/10 border-2 border-cyan-400/40 flex items-center justify-center backdrop-blur-md shadow-2xl shadow-cyan-500/20 mb-3 animate-pulse">
              <span className="text-3xl sm:text-4xl">{disciplineEmoji}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-950/80 border border-cyan-500/40 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>▶ Lesson Video · High-Performance HD Technique</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-2 drop-shadow-md">
              {lesson.title} Biomechanical Breakdown ({activeAngle} View · {playbackSpeed})
            </p>
          </div>

          {/* Top Bar Controls */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                PRO MASTERCLASS
              </span>
              <span className="hidden sm:inline-flex px-2 py-1 rounded-lg text-[11px] font-mono bg-black/60 backdrop-blur-md text-slate-300 border border-slate-700">
                1080p 60FPS
              </span>
            </div>

            {/* Camera Angle Selector */}
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-slate-700 text-xs">
              {(['Side-On', 'Front-On', 'Bird-Eye'] as const).map((angle) => (
                <button
                  key={angle}
                  onClick={() => setActiveAngle(angle)}
                  className={`px-2 py-1 rounded-lg font-mono text-[10px] sm:text-xs transition-colors cursor-pointer ${
                    activeAngle === angle
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {angle}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Bar Controls */}
          <div className="relative z-10 flex items-center justify-between gap-3 bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold hover:scale-105 transition-transform cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
              </button>

              <button
                onClick={() =>
                  setPlaybackSpeed((prev) => (prev === '1.0x' ? '0.5x Slow-Mo' : '1.0x'))
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-mono font-bold text-cyan-300 border border-slate-700 hover:bg-slate-700 cursor-pointer"
                title="Toggle Speed"
              >
                {playbackSpeed}
              </button>

              <span className="text-xs font-mono text-slate-300">
                03:24 / 0{lesson.durationMin}:00
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Technique Telemetry Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: What You'll Learn, Key Technique Points & Practice Drill */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: What You'll Learn & Key Points */}
        <div className="lg:col-span-7 space-y-6">
          {/* 3. What You'll Learn */}
          <div
            className={`p-6 sm:p-7 rounded-3xl border transition-all ${
              isDark ? 'bg-[#06182a]/90 border-slate-800 shadow-lg' : 'bg-white border-slate-200 shadow-md shadow-slate-200/50'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  What You&apos;ll Learn
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {lesson.title === 'Grip'
                    ? 'Core principles of bat control and hand positioning'
                    : lesson.title === 'Stance'
                    ? 'Core principles of balance, base, and athletic readiness'
                    : `Essential technique principles and biomechanics of ${lesson.title.toLowerCase()}`}
                </p>
              </div>
            </div>

            {lesson.whatYoullLearn && lesson.whatYoullLearn.length > 0 ? (
              <div className="space-y-3">
                {lesson.whatYoullLearn.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {item.topic}
                    </h4>
                    <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {item.details}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {lesson.description}
              </p>
            )}
          </div>

          {/* 4. Key Technique Points */}
          <div
            className={`p-6 sm:p-7 rounded-3xl border transition-all ${
              isDark ? 'bg-[#06182a]/90 border-slate-800 shadow-lg' : 'bg-white border-slate-200 shadow-md shadow-slate-200/50'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Key Technique Points
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Checklist of essential execution standards
                </p>
              </div>
            </div>

            <ul className="space-y-3">
              {lesson.keyPoints.map((point, index) => (
                <li
                  key={index}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-colors ${
                    isDark
                      ? 'bg-slate-900/60 border-slate-800/80 text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-xs sm:text-sm leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Practice Drill & Progress Completion Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* 5. Practice Drill & 6. Practice Completion */}
          <div
            className={`p-6 sm:p-7 rounded-3xl border transition-all ${
              isDark ? 'bg-[#06182a]/90 border-slate-800 shadow-lg' : 'bg-white border-slate-200 shadow-md shadow-slate-200/50'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Field Practice Drill
                </span>
                <h3 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {lesson.practiceDrill.title}
                </h3>
              </div>
            </div>

            {/* Goal */}
            {lesson.practiceDrill.goal && (
              <div className={`p-3 rounded-2xl border mb-3 text-xs leading-relaxed ${isDark ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                <span className="font-bold">Goal: </span>
                {lesson.practiceDrill.goal}
              </div>
            )}

            {/* Suggested Reps & Duration Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {lesson.practiceDrill.suggestedReps ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Reps: {lesson.practiceDrill.suggestedReps}</span>
                </div>
              ) : lesson.practiceDrill.repsOrDuration ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Target: {lesson.practiceDrill.repsOrDuration}</span>
                </div>
              ) : null}

              {lesson.practiceDrill.suggestedDuration && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Duration: {lesson.practiceDrill.suggestedDuration}</span>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-2.5 mb-5">
              {lesson.practiceDrill.instructions.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 border ${
                    isDark ? 'bg-slate-900/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>

            {/* 6. Practice Completion Toggle (Separate from lesson completion) */}
            <button
              onClick={() => setIsPracticeCompleted((prev) => !prev)}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                isPracticeCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isPracticeCompleted ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{isPracticeCompleted ? 'Practice Drill Completed ✓' : 'Mark Practice as Completed'}</span>
            </button>
          </div>

          {/* 7. Lesson Completion Card & 8. Next Lesson */}
          <div
            className={`p-6 sm:p-7 rounded-3xl border transition-all shadow-xl ${
              isDark
                ? 'bg-gradient-to-br from-[#0a233d] to-[#051424] border-cyan-500/30'
                : 'bg-gradient-to-br from-cyan-50/70 to-teal-50/50 border-cyan-200'
            }`}
          >
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs font-mono font-bold mb-1.5">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    Discipline Progress
                  </span>
                  <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>
                    Lesson {disciplineLessonIndex + 1} of {totalLessonsInDiscipline}
                  </span>
                </div>
                <ProgressBar
                  value={progressPercent}
                  size="md"
                  color={isCompleted ? 'emerald' : 'cyan'}
                  isDark={isDark}
                />
              </div>

              {/* 7. Mark Lesson Complete Button */}
              <button
                onClick={() => onToggleComplete(lesson.id)}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/30 hover:scale-[1.01]'
                    : 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 shadow-cyan-500/30 hover:scale-[1.01]'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>{isCompleted ? 'Lesson Complete ✓' : '✓ Mark Lesson Complete'}</span>
              </button>

              {/* 8. Next Lesson Direct Trigger */}
              {hasNextLesson && (
                <button
                  onClick={onNextLesson}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    isCompleted
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 shadow-md'
                      : isDark
                      ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-xs'
                  }`}
                >
                  <span>Next Lesson → {nextLessonTitle || 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

