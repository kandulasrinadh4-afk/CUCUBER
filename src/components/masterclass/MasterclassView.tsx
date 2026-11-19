import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, MasterclassDiscipline, MasterclassLesson, MasterclassProgress } from '../../types';
import { auth } from '../../lib/firebase';
import { updateUserMasterclassProgress } from '../../services/userService';
import {
  BATTING_MODULES,
  BOWLING_MODULES,
  ALL_MASTERCLASS_LESSONS,
  ALL_BATTING_LESSONS,
  ALL_BOWLING_LESSONS,
  TOTAL_BATTING_LESSONS,
  TOTAL_BOWLING_LESSONS,
  TOTAL_MASTERCLASS_LESSONS,
  getLessonById,
  getRecommendedLessons,
} from '../../data/masterclassData';
import { MasterclassHome } from './MasterclassHome';
import { DisciplineScreen } from './DisciplineScreen';
import { LessonScreen } from './LessonScreen';

interface MasterclassViewProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

type ViewState =
  | { mode: 'home' }
  | { mode: 'discipline'; discipline: MasterclassDiscipline }
  | { mode: 'lesson'; lessonId: string };

export const MasterclassView: React.FC<MasterclassViewProps> = ({ user, setUser }) => {
  const [viewState, setViewState] = useState<ViewState>({ mode: 'home' });

  const isDark = user.theme === 'dark';

  // Read current progress from user state with default fallback
  const masterclassProgress: MasterclassProgress = useMemo(() => {
    return (
      user.masterclassProgress || {
        completedLessons: [],
        currentLesson: null,
        battingProgress: 0,
        bowlingProgress: 0,
        lastActiveLessonId: null,
      }
    );
  }, [user.masterclassProgress]);

  const completedLessonIds = masterclassProgress.completedLessons || [];

  // Determine active lesson for Continue Learning Card:
  // NEW USER / NO MASTERCLASS PROGRESS:
  // If masterclassProgress does not exist, or completedLessons is empty AND currentLesson is null -> null
  // RETURNING USER:
  // 1. If currentLesson exists, show that lesson.
  // 2. If currentLesson does not exist but completedLessons contains lessons, determine the next uncompleted lesson in curriculum order.
  const activeLesson = useMemo(() => {
    const hasCurrentLesson = !!masterclassProgress.currentLesson;
    const hasCompleted = completedLessonIds.length > 0;

    // Brand new user / no progress
    if (!hasCurrentLesson && !hasCompleted) {
      return null;
    }

    // 1. If currentLesson exists, show that lesson
    if (hasCurrentLesson) {
      const found = getLessonById(masterclassProgress.currentLesson!);
      if (found) return found;
    }

    // 2. If currentLesson does not exist but completedLessons contains lessons, determine next uncompleted lesson in curriculum order
    if (hasCompleted) {
      const nextUncompleted = ALL_MASTERCLASS_LESSONS.find(
        (l) => !completedLessonIds.includes(l.id)
      );
      if (nextUncompleted) return nextUncompleted;
      // All lessons completed: fallback to the last lesson in curriculum
      return ALL_MASTERCLASS_LESSONS[ALL_MASTERCLASS_LESSONS.length - 1] || ALL_MASTERCLASS_LESSONS[0];
    }

    return null;
  }, [masterclassProgress.currentLesson, completedLessonIds]);

  // Overall masterclass completion percentage calculated dynamically from real completed lessons
  const overallCompletionPercent = useMemo(() => {
    if (TOTAL_MASTERCLASS_LESSONS === 0) return 0;
    return Math.round((completedLessonIds.length / TOTAL_MASTERCLASS_LESSONS) * 100);
  }, [completedLessonIds]);

  // Recommended lessons based on uncompleted
  const recommendedLessons = useMemo(() => {
    return getRecommendedLessons(completedLessonIds, 3);
  }, [completedLessonIds]);

  // Progress Update & Persistence Handler for Lesson Completion
  const handleToggleComplete = async (lessonId: string) => {
    const isCurrentlyCompleted = completedLessonIds.includes(lessonId);
    let updatedCompleted: string[];
    let nextCurrentLessonId: string | null = null;

    if (!isCurrentlyCompleted) {
      // 1. Add its lesson ID to completedLessons if not already present
      updatedCompleted = [...completedLessonIds, lessonId];

      // 2. Update currentLesson to the next uncompleted lesson in curriculum order
      const nextUncompleted = ALL_MASTERCLASS_LESSONS.find(
        (l) => !updatedCompleted.includes(l.id)
      );
      nextCurrentLessonId = nextUncompleted ? nextUncompleted.id : lessonId;
    } else {
      // Un-completing lesson
      updatedCompleted = completedLessonIds.filter((id) => id !== lessonId);
      nextCurrentLessonId = lessonId;
    }

    const completedBatCount = updatedCompleted.filter((id) => id.startsWith('bat-')).length;
    const completedBowlCount = updatedCompleted.filter((id) => id.startsWith('bowl-')).length;

    const battingPct = Math.round((completedBatCount / TOTAL_BATTING_LESSONS) * 100);
    const bowlingPct = Math.round((completedBowlCount / TOTAL_BOWLING_LESSONS) * 100);

    const updatedProgress: MasterclassProgress = {
      completedLessons: updatedCompleted,
      currentLesson: nextCurrentLessonId,
      battingProgress: battingPct,
      bowlingProgress: bowlingPct,
      lastActiveLessonId: nextCurrentLessonId,
    };

    // 3. Update React state immediately (refreshes card immediately)
    setUser((prev) => ({
      ...prev,
      masterclassProgress: updatedProgress,
    }));

    // 4. Persist to Firestore if authenticated user
    const currentAuthUser = auth.currentUser;
    if (currentAuthUser?.uid) {
      try {
        await updateUserMasterclassProgress(currentAuthUser.uid, updatedProgress);
      } catch (err) {
        console.error('Failed to sync masterclass progress to Firestore:', err);
      }
    }
  };

  // Lesson selection handler
  const handleSelectLesson = async (lesson: MasterclassLesson) => {
    setViewState({ mode: 'lesson', lessonId: lesson.id });

    // Update currentLesson in user state & Firestore
    const updatedProgress: MasterclassProgress = {
      ...masterclassProgress,
      currentLesson: lesson.id,
      lastActiveLessonId: lesson.id,
    };

    setUser((prev) => ({
      ...prev,
      masterclassProgress: updatedProgress,
    }));

    const currentAuthUser = auth.currentUser;
    if (currentAuthUser?.uid) {
      try {
        await updateUserMasterclassProgress(currentAuthUser.uid, {
          currentLesson: lesson.id,
          lastActiveLessonId: lesson.id,
        });
      } catch (err) {
        console.error('Failed to sync active lesson to Firestore:', err);
      }
    }
  };

  const handleStartFirstLesson = () => {
    // Recommended first lesson: "Grip" (Batting Module 1, id: 'bat-1-1')
    const gripLesson = getLessonById('bat-1-1') || ALL_BATTING_LESSONS[0];
    if (gripLesson) {
      handleSelectLesson(gripLesson);
    }
  };

  // Render view based on state
  if (viewState.mode === 'discipline') {
    const isBatting = viewState.discipline === 'batting';
    const modules = isBatting ? BATTING_MODULES : BOWLING_MODULES;

    return (
      <DisciplineScreen
        discipline={viewState.discipline}
        modules={modules}
        completedLessonIds={completedLessonIds}
        activeLessonId={masterclassProgress.currentLesson || masterclassProgress.lastActiveLessonId}
        isDark={isDark}
        onBack={() => setViewState({ mode: 'home' })}
        onSelectLesson={handleSelectLesson}
      />
    );
  }

  if (viewState.mode === 'lesson') {
    const currentLesson = getLessonById(viewState.lessonId) || ALL_MASTERCLASS_LESSONS[0];
    const isBatting = currentLesson.discipline === 'batting';
    const disciplineLessons = isBatting ? ALL_BATTING_LESSONS : ALL_BOWLING_LESSONS;
    const lessonIndex = disciplineLessons.findIndex((l) => l.id === currentLesson.id);

    const hasPrev = lessonIndex > 0;
    const hasNext = lessonIndex < disciplineLessons.length - 1;
    const nextLesson = hasNext ? disciplineLessons[lessonIndex + 1] : undefined;

    return (
      <LessonScreen
        lesson={currentLesson}
        isCompleted={completedLessonIds.includes(currentLesson.id)}
        totalLessonsInDiscipline={disciplineLessons.length}
        disciplineLessonIndex={lessonIndex !== -1 ? lessonIndex : 0}
        isDark={isDark}
        onBack={() => setViewState({ mode: 'discipline', discipline: currentLesson.discipline })}
        onToggleComplete={handleToggleComplete}
        hasPrevLesson={hasPrev}
        hasNextLesson={hasNext}
        nextLessonTitle={nextLesson?.title}
        onPrevLesson={() => {
          if (hasPrev) {
            handleSelectLesson(disciplineLessons[lessonIndex - 1]);
          }
        }}
        onNextLesson={() => {
          if (hasNext) {
            handleSelectLesson(disciplineLessons[lessonIndex + 1]);
          }
        }}
      />
    );
  }

  // Default: Masterclass Home
  return (
    <MasterclassHome
      completedLessonIds={completedLessonIds}
      activeLesson={activeLesson}
      overallCompletionPercent={overallCompletionPercent}
      recommendedLessons={recommendedLessons}
      isDark={isDark}
      onSelectDiscipline={(discipline) => setViewState({ mode: 'discipline', discipline })}
      onSelectLesson={handleSelectLesson}
      onStartFirstLesson={handleStartFirstLesson}
    />
  );
};
