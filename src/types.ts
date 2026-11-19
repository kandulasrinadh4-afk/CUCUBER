export type MatchStatusType = 'LIVE' | 'UPCOMING' | 'RECENT' | 'INTERRUPTED';

export interface PlayerStat {
  name: string;
  runs?: number | string;
  balls?: number | string;
  fours?: number | string;
  sixes?: number | string;
  sr?: number | string;
  overs?: number | string;
  maidens?: number | string;
  wickets?: number | string;
  economy?: number | string;
  wides?: number | string;
  noBalls?: number | string;
  isStriker?: boolean;
  isBowling?: boolean;
  dismissal?: string;
  isNotOut?: boolean;
}

export interface InningsScorecard {
  teamName: string;
  teamShort: string;
  inningsNumber?: number;
  flagUrl?: string;
  score: string;
  runs?: number | string | null;
  wickets?: number | string | null;
  overs: string;
  runRate?: number | string | null;
  batters: PlayerStat[];
  bowlers: PlayerStat[];
  fallOfWickets?: { batter: string; score: string; over: string; wicketNumber?: number }[];
  partnerships?: { batters: string; runs: number | string; balls?: number | string | null }[];
  yetToBat?: string[];
  extras?: {
    wides?: number | string | null;
    noBalls?: number | string | null;
    byes?: number | string | null;
    legByes?: number | string | null;
    penalty?: number | string | null;
    total?: number | string | null;
    details?: string | null;
  };
}

export interface BallCommentary {
  id: string;
  overNumber: string; // e.g. "19.2"
  runs: number;
  isWicket: boolean;
  isBoundary: boolean;
  isSix: boolean;
  isMilestone?: boolean;
  milestoneTitle?: string;
  description: string;
  bowler: string;
  batter: string;
  timestamp: string;
  tag?: 'Wicket' | 'Six' | 'Four' | 'Milestone' | 'Rain Delay' | 'Play Resumed';
}

export interface MatchData {
  id: string;
  matchId?: string;
  title: string; // e.g., "1st T20I • Wankhede Stadium, Mumbai"
  tournament: string; // "ICC T20 Men's World Cup 2026"
  matchType?: string; // "ODI" | "T20" | "T20I" | "Test" | "List A"
  date?: string | null;
  city?: string | null;
  country?: string | null;
  teamA: {
    name: string;
    shortName: string;
    logo: string;
    score: string;
    overs: string;
  };
  teamB: {
    name: string;
    shortName: string;
    logo: string;
    score?: string;
    overs?: string;
  };
  status: MatchStatusType;
  statusText: string; // e.g. "India need 24 runs in 16 balls" or "Play Interrupted due to Rain"
  venue: string;
  crr?: number;
  rrr?: number;
  projectedScore?: number;
  target?: number;
  recentBalls: string[]; // e.g., ['1', '0', '4', '2', '1', 'W', '6']
  currentInnings: InningsScorecard;
  commentary: BallCommentary[];
  rainDelayDetails?: {
    interruptedAt: string;
    expectedResume?: string;
    revisedTarget?: string;
  };
  sources?: { title: string; url: string }[];
  sourceUrl?: string;
  startTime?: string | null;
  result?: string | null;
  winner?: string | null;
  margin?: string | null;
  tossWinner?: string | null;
  tossDecision?: string | null;
  playerOfMatch?: string | null;
  homeTeam?: {
    name: string;
    shortName: string;
    score: string | null;
    wickets: number | null;
    overs: string | null;
    logo?: string;
  };
  awayTeam?: {
    name: string;
    shortName: string;
    score: string | null;
    wickets: number | null;
    overs: string | null;
    logo?: string;
  };
  requiredRuns?: number | null;
  requiredBalls?: number | null;
  runRate?: number | null;
  innings?: InningsScorecard[];
  lastUpdated?: string;
  toss?: string;
  matchSummary?: string;
  umpires?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: 'Latest' | 'For You' | 'Teams' | 'Players' | 'Tournaments' | 'Matches' | 'Breaking News';
  timeAgo: string;
  readTime: string;
  imageUrl: string;
  source: string;
  tags: string[];
  url?: string;
  sourceUrl?: string;
}

export interface AlertPreset {
  id: 'essential' | 'balanced' | 'everything' | 'custom';
  name: string;
  description: string;
}

export interface AlertPreferences {
  preset: AlertPreset['id'];
  busyMode: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: { enabled: boolean; start: string; end: string };
  events: {
    matchStart: boolean;
    toss: boolean;
    matchResult: boolean;
    wicket: boolean;
    halfCentury: boolean;
    century: boolean;
    boundaries: boolean;
    rainDelay: boolean;
    playResumed: boolean;
    criticalOvers: boolean;
  };
}

export interface MasterclassProgress {
  completedLessons: string[];
  currentLesson: string | null;
  battingProgress: number;
  bowlingProgress: number;
  lastActiveLessonId?: string | null;
  updatedAt?: any;
}

export type MasterclassDiscipline = 'batting' | 'bowling';

export interface MasterclassLesson {
  id: string;
  title: string;
  discipline: MasterclassDiscipline;
  moduleId: string;
  moduleTitle: string;
  subSection?: string;
  description: string;
  whatYoullLearn?: {
    topic: string;
    details: string;
  }[];
  keyPoints: string[];
  practiceDrill: {
    title: string;
    goal?: string;
    instructions: string[];
    repsOrDuration?: string;
    suggestedReps?: string;
    suggestedDuration?: string;
  };
  durationMin: number;
  order: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface MasterclassModule {
  id: string;
  discipline: MasterclassDiscipline;
  title: string;
  description: string;
  lessons: MasterclassLesson[];
  subSections?: string[];
  order: number;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  favoriteTeams: string[];
  favoritePlayers: string[];
  theme: 'dark' | 'light';
  preferences: AlertPreferences;
  onboardingCompleted?: boolean;
  masterclassProgress?: MasterclassProgress;
}

export type AuthScreenType = 'none' | 'signin' | 'signup' | 'otp' | 'reset-password' | 'auth-debug';

export interface FirestoreUserPreferences {
  theme: 'dark' | 'light';
  language: string;
  defaultAlertPreset: 'balanced' | 'all' | 'key' | 'wickets';
  busyModeEnabled: boolean;
  notificationPreferences: {
    wickets: boolean;
    milestones: boolean;
    rainDelays: boolean;
    inningsBreak: boolean;
    matchResult: boolean;
    hourlyDigest: boolean;
    sound: boolean;
    boundaries?: boolean;
  };
  newsPreferences: {
    categories: string[];
  };
  followedTeams: string[];
  followedPlayers: string[];
  followedTournaments: string[];
  savedNews: string[];
}

export interface FirestoreUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  authProvider: string;
  createdAt?: any;
  updatedAt?: any;
  onboardingCompleted: boolean;
  preferences: FirestoreUserPreferences;
  masterclassProgress?: MasterclassProgress;
}

export type ReactionType = 'six' | 'wicket' | 'cheer' | 'fire' | 'shock' | 'clutch';

export interface MatchReaction {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  reactionType: ReactionType;
  message?: string;
  createdAt: number;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface CommunityPoll {
  id: string;
  matchId: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  updatedAt?: any;
}


