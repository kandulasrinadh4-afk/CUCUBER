import { MatchData, NewsArticle, UserProfile } from '../types';

export const MOCK_MATCHES: MatchData[] = [];

export const MOCK_NEWS: NewsArticle[] = [];

export const DEFAULT_USER: UserProfile = {
  name: 'Cricket Fan',
  email: 'user@example.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  favoriteTeams: [],
  favoritePlayers: [],
  theme: 'dark',
  preferences: {
    preset: 'balanced',
    busyMode: false,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: { enabled: false, start: '23:00', end: '07:00' },
    events: {
      matchStart: true,
      toss: true,
      matchResult: true,
      wicket: true,
      halfCentury: true,
      century: true,
      boundaries: false,
      rainDelay: true,
      playResumed: true,
      criticalOvers: true,
    },
  },
  masterclassProgress: {
    completedLessons: [],
    currentLesson: null,
    battingProgress: 0,
    bowlingProgress: 0,
    lastActiveLessonId: null,
  },
};

