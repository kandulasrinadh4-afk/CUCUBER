export type MatchStatusType = 'LIVE' | 'UPCOMING' | 'RECENT' | 'INTERRUPTED';

export interface DataSourceAttribution {
  title: string;
  url: string;
}

export interface NormalizedPlayerBatter {
  name: string;
  runs: number | string;
  balls: number | string;
  fours: number | string;
  sixes: number | string;
  sr: number | string;
  isStriker: boolean;
  isNotOut: boolean;
  dismissal: string;
}

export interface NormalizedPlayerBowler {
  name: string;
  overs: number | string;
  maidens: number | string;
  runs: number | string;
  wickets: number | string;
  economy: number | string;
  wides: number | string;
  noBalls: number | string;
  isBowling: boolean;
}

export interface NormalizedExtras {
  wides: number | null;
  noBalls: number | null;
  byes: number | null;
  legByes: number | null;
  penalty: number | null;
  total: number | null;
  details: string | null;
}

export interface NormalizedFallOfWicket {
  batter: string;
  score: string;
  over: string;
  wicketNumber?: number;
}

export interface NormalizedPartnership {
  batters: string;
  runs: number | string;
  balls?: number | string | null;
}

export interface NormalizedInnings {
  inningsNumber: number;
  teamName: string;
  teamShort: string;
  score: string;
  runs: number | null;
  wickets: number | null;
  overs: string;
  runRate: number | null;
  batters: NormalizedPlayerBatter[];
  bowlers: NormalizedPlayerBowler[];
  fallOfWickets: NormalizedFallOfWicket[];
  partnerships: NormalizedPartnership[];
  yetToBat: string[];
  extras?: NormalizedExtras;
}

export interface NormalizedBallCommentary {
  id: string;
  overNumber: string;
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

export interface NormalizedTeam {
  name: string;
  shortName: string;
  score: string | null;
  wickets: number | null;
  overs: string | null;
  logo: string;
}

export interface NormalizedMatch {
  id: string;
  matchId?: string;
  provider: string;
  providerMatchId: string;
  tournament: string;
  category?: 'International' | 'Domestic' | 'Franchise';
  title: string;
  matchType?: string;
  date?: string | null;
  venue: string;
  city?: string | null;
  country?: string | null;
  status: MatchStatusType;
  startTime: string | null;
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  target: number | null;
  requiredRuns: number | null;
  requiredBalls: number | null;
  runRate: number | null;
  result: string | null;
  winner?: string | null;
  margin?: string | null;
  tossWinner?: string | null;
  tossDecision?: string | null;
  playerOfMatch?: string | null;
  statusText: string;
  sources: DataSourceAttribution[];
  sourceUrl?: string;
  ballByBallSupported?: boolean;

  // UI compatibility fields
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
  crr?: number;
  rrr?: number;
  projectedScore?: number;
  recentBalls: string[];
  currentInnings: NormalizedInnings;
  commentary: NormalizedBallCommentary[];
  innings?: NormalizedInnings[];
  lastUpdated?: string;
  toss?: string;
  matchSummary?: string;
  umpires?: string;
  rainDelayDetails?: {
    interruptedAt: string;
    expectedResume?: string;
    revisedTarget?: string;
  };
}

export interface NormalizedNewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedTime?: string;
  category: 'Latest' | 'For You' | 'Teams' | 'Players' | 'Tournaments' | 'Matches' | 'Breaking News';
  timeAgo: string;
  readTime: string;
  imageUrl: string;
  tags: string[];
  url: string;
}

export type ProviderAvailabilityCode =
  | 'OK'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'RATE_LIMITED'
  | 'PLAN_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'NOT_FOUND'
  | 'SCORECARD_UNAVAILABLE';

export interface ProviderFetchMatchesResult {
  matches: NormalizedMatch[];
  provider: string;
  statusCode: number;
  code: ProviderAvailabilityCode;
  error?: string;
  retryAfterSeconds?: number;
}

export interface ProviderFetchMatchDetailResult {
  match: NormalizedMatch | null;
  provider: string;
  statusCode: number;
  code: ProviderAvailabilityCode;
  error?: string;
  retryAfterSeconds?: number;
  ballByBallAvailable?: boolean;
}

export interface CricketMatchProvider {
  readonly id: string;
  readonly name: string;
  readonly isPrimary: boolean;
  isConfigured(): boolean;
  supportsMatchId(matchId: string): boolean;
  extractProviderMatchId(matchId: string): string;
  fetchMatches(): Promise<ProviderFetchMatchesResult>;
  fetchMatchDetails(matchId: string): Promise<ProviderFetchMatchDetailResult>;
}

export interface ProviderFetchNewsResult {
  articles: NormalizedNewsArticle[];
  provider: string;
  error?: string;
}

export interface CricketNewsProvider {
  readonly id: string;
  readonly name: string;
  isEnabled(): boolean;
  fetchArticles(): Promise<ProviderFetchNewsResult>;
}

export interface MatchesApiResponse {
  source: string;
  providers: string[];
  cached: boolean;
  stale?: boolean;
  count: number;
  matches: NormalizedMatch[];
  statusCode: number;
  code: ProviderAvailabilityCode;
  error?: string;
  retryAfterSeconds?: number;
}

export interface MatchDetailApiResponse {
  source: string;
  match: NormalizedMatch | null;
  cached: boolean;
  stale?: boolean;
  statusCode: number;
  code: ProviderAvailabilityCode;
  error?: string;
  retryAfterSeconds?: number;
}

export interface ScorecardApiResponse {
  source: string;
  matchId: string;
  scorecardAvailable: boolean;
  partial: boolean;
  ballByBallAvailable: boolean;
  status: MatchStatusType | 'UNKNOWN';
  cached: boolean;
  stale?: boolean;
  statusCode: number;
  code: ProviderAvailabilityCode;
  error?: string;
  retryAfterSeconds?: number;
  innings: NormalizedInnings[];
  currentInnings: NormalizedInnings | null;
  commentary: NormalizedBallCommentary[];
  recentBalls: string[];
  toss?: string;
  result?: string | null;
  playerOfMatch?: string | null;
  venue?: string;
  matchSummary?: string;
  match?: NormalizedMatch | null;
}

export interface NewsApiResponse {
  source: string;
  providers: string[];
  cached: boolean;
  stale?: boolean;
  count: number;
  articles: NormalizedNewsArticle[];
  statusCode: number;
  error?: string;
  failedProviders?: { provider: string; error: string }[];
}
