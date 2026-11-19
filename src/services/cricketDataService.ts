// Team and Player data structure and query service

export interface TeamPlayer {
  id: string;
  name: string;
  team: string;
  role?: 'Batter' | 'Bowler' | 'All-Rounder' | 'Wicketkeeper';
  isActive: boolean;
}

export interface CricketTeam {
  id: string;
  name: string;
  shortName: string;
  category: 'International' | 'Franchise' | 'Domestic';
}

export const AVAILABLE_TEAMS: CricketTeam[] = [
  { id: 'ind', name: 'India', shortName: 'IND', category: 'International' },
  { id: 'aus', name: 'Australia', shortName: 'AUS', category: 'International' },
  { id: 'eng', name: 'England', shortName: 'ENG', category: 'International' },
  { id: 'pak', name: 'Pakistan', shortName: 'PAK', category: 'International' },
  { id: 'sa', name: 'South Africa', shortName: 'SA', category: 'International' },
  { id: 'nz', name: 'New Zealand', shortName: 'NZ', category: 'International' },
  { id: 'wi', name: 'West Indies', shortName: 'WI', category: 'International' },
  { id: 'sl', name: 'Sri Lanka', shortName: 'SL', category: 'International' },
  { id: 'ban', name: 'Bangladesh', shortName: 'BAN', category: 'International' },
  { id: 'afg', name: 'Afghanistan', shortName: 'AFG', category: 'International' },
];

export const TEAM_PLAYERS: Record<string, TeamPlayer[]> = {
  India: [
    { id: 'ind-1', name: 'Virat Kohli', team: 'India', role: 'Batter', isActive: true },
    { id: 'ind-2', name: 'Rohit Sharma', team: 'India', role: 'Batter', isActive: true },
    { id: 'ind-3', name: 'Jasprit Bumrah', team: 'India', role: 'Bowler', isActive: true },
    { id: 'ind-4', name: 'Shubman Gill', team: 'India', role: 'Batter', isActive: true },
    { id: 'ind-5', name: 'Suryakumar Yadav', team: 'India', role: 'Batter', isActive: true },
    { id: 'ind-6', name: 'Hardik Pandya', team: 'India', role: 'All-Rounder', isActive: true },
    { id: 'ind-7', name: 'Rishabh Pant', team: 'India', role: 'Wicketkeeper', isActive: true },
    { id: 'ind-8', name: 'Ravindra Jadeja', team: 'India', role: 'All-Rounder', isActive: true },
    { id: 'ind-9', name: 'Mohammed Siraj', team: 'India', role: 'Bowler', isActive: true },
    { id: 'ind-10', name: 'Kuldeep Yadav', team: 'India', role: 'Bowler', isActive: true },
    { id: 'ind-11', name: 'Yashasvi Jaiswal', team: 'India', role: 'Batter', isActive: true },
    { id: 'ind-12', name: 'Axar Patel', team: 'India', role: 'All-Rounder', isActive: true },
    { id: 'ind-13', name: 'Arshdeep Singh', team: 'India', role: 'Bowler', isActive: true },
    { id: 'ind-14', name: 'KL Rahul', team: 'India', role: 'Wicketkeeper', isActive: true },
    { id: 'ind-15', name: 'Shreyas Iyer', team: 'India', role: 'Batter', isActive: true },
  ],
  Australia: [
    { id: 'aus-1', name: 'Pat Cummins', team: 'Australia', role: 'Bowler', isActive: true },
    { id: 'aus-2', name: 'Travis Head', team: 'Australia', role: 'Batter', isActive: true },
    { id: 'aus-3', name: 'Mitchell Starc', team: 'Australia', role: 'Bowler', isActive: true },
    { id: 'aus-4', name: 'Glenn Maxwell', team: 'Australia', role: 'All-Rounder', isActive: true },
    { id: 'aus-5', name: 'Steve Smith', team: 'Australia', role: 'Batter', isActive: true },
    { id: 'aus-6', name: 'Josh Hazlewood', team: 'Australia', role: 'Bowler', isActive: true },
    { id: 'aus-7', name: 'Mitchell Marsh', team: 'Australia', role: 'All-Rounder', isActive: true },
    { id: 'aus-8', name: 'Adam Zampa', team: 'Australia', role: 'Bowler', isActive: true },
    { id: 'aus-9', name: 'Marnus Labuschagne', team: 'Australia', role: 'Batter', isActive: true },
    { id: 'aus-10', name: 'Alex Carey', team: 'Australia', role: 'Wicketkeeper', isActive: true },
    { id: 'aus-11', name: 'Cameron Green', team: 'Australia', role: 'All-Rounder', isActive: true },
    { id: 'aus-12', name: 'Josh Inglis', team: 'Australia', role: 'Wicketkeeper', isActive: true },
  ],
  England: [
    { id: 'eng-1', name: 'Jos Buttler', team: 'England', role: 'Wicketkeeper', isActive: true },
    { id: 'eng-2', name: 'Harry Brook', team: 'England', role: 'Batter', isActive: true },
    { id: 'eng-3', name: 'Joe Root', team: 'England', role: 'Batter', isActive: true },
    { id: 'eng-4', name: 'Ben Stokes', team: 'England', role: 'All-Rounder', isActive: true },
    { id: 'eng-5', name: 'Jofra Archer', team: 'England', role: 'Bowler', isActive: true },
    { id: 'eng-6', name: 'Liam Livingstone', team: 'England', role: 'All-Rounder', isActive: true },
    { id: 'eng-7', name: 'Phil Salt', team: 'England', role: 'Batter', isActive: true },
    { id: 'eng-8', name: 'Mark Wood', team: 'England', role: 'Bowler', isActive: true },
    { id: 'eng-9', name: 'Adil Rashid', team: 'England', role: 'Bowler', isActive: true },
    { id: 'eng-10', name: 'Sam Curran', team: 'England', role: 'All-Rounder', isActive: true },
    { id: 'eng-11', name: 'Jonny Bairstow', team: 'England', role: 'Wicketkeeper', isActive: true },
    { id: 'eng-12', name: 'Rehan Ahmed', team: 'England', role: 'Bowler', isActive: true },
  ],
  Pakistan: [
    { id: 'pak-1', name: 'Babar Azam', team: 'Pakistan', role: 'Batter', isActive: true },
    { id: 'pak-2', name: 'Shaheen Afridi', team: 'Pakistan', role: 'Bowler', isActive: true },
    { id: 'pak-3', name: 'Mohammad Rizwan', team: 'Pakistan', role: 'Wicketkeeper', isActive: true },
    { id: 'pak-4', name: 'Naseem Shah', team: 'Pakistan', role: 'Bowler', isActive: true },
    { id: 'pak-5', name: 'Haris Rauf', team: 'Pakistan', role: 'Bowler', isActive: true },
    { id: 'pak-6', name: 'Shadab Khan', team: 'Pakistan', role: 'All-Rounder', isActive: true },
    { id: 'pak-7', name: 'Fakhar Zaman', team: 'Pakistan', role: 'Batter', isActive: true },
    { id: 'pak-8', name: 'Saim Ayub', team: 'Pakistan', role: 'Batter', isActive: true },
    { id: 'pak-9', name: 'Aamer Jamal', team: 'Pakistan', role: 'All-Rounder', isActive: true },
    { id: 'pak-10', name: 'Iftikhar Ahmed', team: 'Pakistan', role: 'All-Rounder', isActive: true },
  ],
  'South Africa': [
    { id: 'sa-1', name: 'Heinrich Klaasen', team: 'South Africa', role: 'Wicketkeeper', isActive: true },
    { id: 'sa-2', name: 'Kagiso Rabada', team: 'South Africa', role: 'Bowler', isActive: true },
    { id: 'sa-3', name: 'Aiden Markram', team: 'South Africa', role: 'Batter', isActive: true },
    { id: 'sa-4', name: 'David Miller', team: 'South Africa', role: 'Batter', isActive: true },
    { id: 'sa-5', name: 'Quinton de Kock', team: 'South Africa', role: 'Wicketkeeper', isActive: true },
    { id: 'sa-6', name: 'Keshav Maharaj', team: 'South Africa', role: 'Bowler', isActive: true },
    { id: 'sa-7', name: 'Anrich Nortje', team: 'South Africa', role: 'Bowler', isActive: true },
    { id: 'sa-8', name: 'Marco Jansen', team: 'South Africa', role: 'All-Rounder', isActive: true },
    { id: 'sa-9', name: 'Tristan Stubbs', team: 'South Africa', role: 'Batter', isActive: true },
    { id: 'sa-10', name: 'Gerald Coetzee', team: 'South Africa', role: 'Bowler', isActive: true },
    { id: 'sa-11', name: 'Lungi Ngidi', team: 'South Africa', role: 'Bowler', isActive: true },
  ],
  'New Zealand': [
    { id: 'nz-1', name: 'Kane Williamson', team: 'New Zealand', role: 'Batter', isActive: true },
    { id: 'nz-2', name: 'Trent Boult', team: 'New Zealand', role: 'Bowler', isActive: true },
    { id: 'nz-3', name: 'Mitchell Santner', team: 'New Zealand', role: 'All-Rounder', isActive: true },
    { id: 'nz-4', name: 'Devon Conway', team: 'New Zealand', role: 'Wicketkeeper', isActive: true },
    { id: 'nz-5', name: 'Rachin Ravindra', team: 'New Zealand', role: 'All-Rounder', isActive: true },
    { id: 'nz-6', name: 'Glenn Phillips', team: 'New Zealand', role: 'All-Rounder', isActive: true },
    { id: 'nz-7', name: 'Tim Southee', team: 'New Zealand', role: 'Bowler', isActive: true },
    { id: 'nz-8', name: 'Matt Henry', team: 'New Zealand', role: 'Bowler', isActive: true },
    { id: 'nz-9', name: 'Daryl Mitchell', team: 'New Zealand', role: 'All-Rounder', isActive: true },
    { id: 'nz-10', name: 'Lockie Ferguson', team: 'New Zealand', role: 'Bowler', isActive: true },
    { id: 'nz-11', name: 'Finn Allen', team: 'New Zealand', role: 'Batter', isActive: true },
  ],
  'West Indies': [
    { id: 'wi-1', name: 'Nicholas Pooran', team: 'West Indies', role: 'Wicketkeeper', isActive: true },
    { id: 'wi-2', name: 'Andre Russell', team: 'West Indies', role: 'All-Rounder', isActive: true },
    { id: 'wi-3', name: 'Shai Hope', team: 'West Indies', role: 'Wicketkeeper', isActive: true },
    { id: 'wi-4', name: 'Alzarri Joseph', team: 'West Indies', role: 'Bowler', isActive: true },
    { id: 'wi-5', name: 'Shimron Hetmyer', team: 'West Indies', role: 'Batter', isActive: true },
    { id: 'wi-6', name: 'Rovman Powell', team: 'West Indies', role: 'Batter', isActive: true },
    { id: 'wi-7', name: 'Akeal Hosein', team: 'West Indies', role: 'Bowler', isActive: true },
    { id: 'wi-8', name: 'Romario Shepherd', team: 'West Indies', role: 'All-Rounder', isActive: true },
    { id: 'wi-9', name: 'Brandon King', team: 'West Indies', role: 'Batter', isActive: true },
    { id: 'wi-10', name: 'Gudakesh Motie', team: 'West Indies', role: 'Bowler', isActive: true },
  ],
  'Sri Lanka': [
    { id: 'sl-1', name: 'Wanindu Hasaranga', team: 'Sri Lanka', role: 'All-Rounder', isActive: true },
    { id: 'sl-2', name: 'Pathum Nissanka', team: 'Sri Lanka', role: 'Batter', isActive: true },
    { id: 'sl-3', name: 'Kusal Mendis', team: 'Sri Lanka', role: 'Wicketkeeper', isActive: true },
    { id: 'sl-4', name: 'Charith Asalanka', team: 'Sri Lanka', role: 'Batter', isActive: true },
    { id: 'sl-5', name: 'Matheesha Pathirana', team: 'Sri Lanka', role: 'Bowler', isActive: true },
    { id: 'sl-6', name: 'Maheesh Theekshana', team: 'Sri Lanka', role: 'Bowler', isActive: true },
    { id: 'sl-7', name: 'Dasun Shanaka', team: 'Sri Lanka', role: 'All-Rounder', isActive: true },
    { id: 'sl-8', name: 'Dunith Wellalage', team: 'Sri Lanka', role: 'All-Rounder', isActive: true },
    { id: 'sl-9', name: 'Dilshan Madushanka', team: 'Sri Lanka', role: 'Bowler', isActive: true },
  ],
  Bangladesh: [
    { id: 'ban-1', name: 'Shakib Al Hasan', team: 'Bangladesh', role: 'All-Rounder', isActive: true },
    { id: 'ban-2', name: 'Najmul Hossain Shanto', team: 'Bangladesh', role: 'Batter', isActive: true },
    { id: 'ban-3', name: 'Taskin Ahmed', team: 'Bangladesh', role: 'Bowler', isActive: true },
    { id: 'ban-4', name: 'Mustafizur Rahman', team: 'Bangladesh', role: 'Bowler', isActive: true },
    { id: 'ban-5', name: 'Litton Das', team: 'Bangladesh', role: 'Wicketkeeper', isActive: true },
    { id: 'ban-6', name: 'Shoriful Islam', team: 'Bangladesh', role: 'Bowler', isActive: true },
    { id: 'ban-7', name: 'Towhid Hridoy', team: 'Bangladesh', role: 'Batter', isActive: true },
    { id: 'ban-8', name: 'Mehidy Hasan Miraz', team: 'Bangladesh', role: 'All-Rounder', isActive: true },
    { id: 'ban-9', name: 'Mahmudullah', team: 'Bangladesh', role: 'All-Rounder', isActive: true },
  ],
  Afghanistan: [
    { id: 'afg-1', name: 'Rashid Khan', team: 'Afghanistan', role: 'All-Rounder', isActive: true },
    { id: 'afg-2', name: 'Rahmanullah Gurbaz', team: 'Afghanistan', role: 'Wicketkeeper', isActive: true },
    { id: 'afg-3', name: 'Mohammad Nabi', team: 'Afghanistan', role: 'All-Rounder', isActive: true },
    { id: 'afg-4', name: 'Fazalhaq Farooqi', team: 'Afghanistan', role: 'Bowler', isActive: true },
    { id: 'afg-5', name: 'Ibrahim Zadran', team: 'Afghanistan', role: 'Batter', isActive: true },
    { id: 'afg-6', name: 'Azmatullah Omarzai', team: 'Afghanistan', role: 'All-Rounder', isActive: true },
    { id: 'afg-7', name: 'Noor Ahmad', team: 'Afghanistan', role: 'Bowler', isActive: true },
    { id: 'afg-8', name: 'Naveen-ul-Haq', team: 'Afghanistan', role: 'Bowler', isActive: true },
    { id: 'afg-9', name: 'Mujeeb Ur Rahman', team: 'Afghanistan', role: 'Bowler', isActive: true },
  ],
};

/**
 * Returns the list of all available team names.
 */
export function getAvailableTeamNames(): string[] {
  return AVAILABLE_TEAMS.map((t) => t.name);
}

/**
 * Returns active players for a specific team.
 */
export function getActivePlayersForTeam(teamName: string): TeamPlayer[] {
  const players = TEAM_PLAYERS[teamName] || [];
  return players.filter((p) => p.isActive);
}

/**
 * Returns active players for a list of selected teams, deduplicated by player name.
 */
export function getActivePlayersForTeams(teamNames: string[]): TeamPlayer[] {
  if (!teamNames || teamNames.length === 0) {
    return [];
  }

  const seenNames = new Set<string>();
  const combinedPlayers: TeamPlayer[] = [];

  for (const teamName of teamNames) {
    const players = getActivePlayersForTeam(teamName);
    for (const player of players) {
      if (!seenNames.has(player.name)) {
        seenNames.add(player.name);
        combinedPlayers.push(player);
      }
    }
  }

  return combinedPlayers;
}

/**
 * Filters a list of selected player names, keeping only those who currently belong
 * to at least one of the selected teams.
 */
export function filterValidPlayersForTeams(playerNames: string[], selectedTeams: string[]): string[] {
  if (!playerNames || playerNames.length === 0 || !selectedTeams || selectedTeams.length === 0) {
    return [];
  }

  const availablePlayers = getActivePlayersForTeams(selectedTeams);
  const validPlayerNameSet = new Set(availablePlayers.map((p) => p.name));

  return playerNames.filter((name) => validPlayerNameSet.has(name));
}

// ==========================================
// REAL-TIME CRICKET MATCH & DATA SERVICE
// ==========================================

import { MatchData, NewsArticle } from '../types';

/**
 * Configuration flag for live cricket API integration.
 * Enables live match telemetry polling and live news feed synchronization with the backend API.
 */
export const IS_LIVE_CRICKET_API_ENABLED = true;

const CLIENT_STORAGE_KEY = 'cucuber_grounded_matches_cache';

function loadCachedMatchesFromStorage(): MatchData[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(CLIENT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.matches) && parsed.matches.length > 0) {
          console.log(`[CricketClient] Cache HIT: loaded ${parsed.matches.length} verified matches from client storage.`);
          return parsed.matches;
        }
      }
    }
  } catch (err) {
    console.warn('[CricketClient] Could not read matches from client storage:', err);
  }
  return [];
}

function saveCachedMatchesToStorage(matches: MatchData[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage && Array.isArray(matches) && matches.length > 0) {
      localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify({
        timestamp: Date.now(),
        matches
      }));
    }
  } catch (err) {
    console.warn('[CricketClient] Could not save matches to client storage:', err);
  }
}

const CLIENT_NEWS_STORAGE_KEY = 'cucuber_grounded_news_cache';

function loadCachedNewsFromStorage(): NewsArticle[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(CLIENT_NEWS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.articles) && parsed.articles.length > 0) {
          console.log(`[NewsClient] Cache HIT: loaded ${parsed.articles.length} verified articles from client storage.`);
          return parsed.articles;
        }
      }
    }
  } catch (err) {
    console.warn('[NewsClient] Could not read news from client storage:', err);
  }
  return [];
}

function saveCachedNewsToStorage(articles: NewsArticle[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage && Array.isArray(articles) && articles.length > 0) {
      localStorage.setItem(CLIENT_NEWS_STORAGE_KEY, JSON.stringify({
        timestamp: Date.now(),
        articles
      }));
    }
  } catch (err) {
    console.warn('[NewsClient] Could not save news to client storage:', err);
  }
}

let cachedMatchesList: MatchData[] = loadCachedMatchesFromStorage();
let cachedNewsList: NewsArticle[] = loadCachedNewsFromStorage();
let lastFetchError: string | null = null;
let hasRateLimitError: boolean = false;
let lastMatchesClientFetchTime: number = 0;
let clientRateLimitCooldownUntil: number = 0;
let inFlightFetchMatchesPromise: Promise<MatchData[]> | null = null;
let cooldownTimerId: any = null;
const CLIENT_MATCHES_CACHE_TTL_MS = 60000; // 60s client cache TTL

let lastNewsClientFetchTime: number = 0;
let clientNewsRateLimitCooldownUntil: number = 0;
let inFlightFetchNewsPromise: Promise<NewsArticle[]> | null = null;
let newsCooldownTimerId: any = null;
const CLIENT_NEWS_CACHE_TTL_MS = 180000; // 3 min client cache TTL

// Active telemetry listeners
const telemetryListeners = new Set<(matches: MatchData[]) => void>();

export function notifyTelemetrySubscribers(matches: MatchData[]) {
  if (!matches || matches.length === 0) return;
  telemetryListeners.forEach((listener) => {
    try {
      listener(matches);
    } catch (err) {
      console.warn('[CricketClient] Subscriber notification error:', err);
    }
  });
}

function scheduleCooldownAutoRetry(delaySeconds: number) {
  if (cooldownTimerId) {
    clearTimeout(cooldownTimerId);
    cooldownTimerId = null;
  }

  const delayMs = Math.max(2000, (delaySeconds * 1000) + 1000); // 1s buffer after cooldown window
  console.log(`[CricketClient] Gemini cooldown ACTIVE: auto-retry scheduled in ${Math.round(delayMs / 1000)}s.`);

  cooldownTimerId = setTimeout(async () => {
    cooldownTimerId = null;
    console.log('[CricketClient] Gemini cooldown EXPIRED: retry started now...');
    try {
      const fresh = await fetchCricketMatches(false);
      console.log(`[CricketClient] Retry completed: returned ${fresh.length} verified matches.`);
      if (fresh && fresh.length > 0) {
        notifyTelemetrySubscribers(fresh);
      }
    } catch (err) {
      console.warn('[CricketClient] Auto-retry error:', err);
    }
  }, delayMs);
}

// Active news listeners
const newsListeners = new Set<(articles: NewsArticle[]) => void>();

export function notifyNewsSubscribers(articles: NewsArticle[]) {
  if (!articles || articles.length === 0) return;
  newsListeners.forEach((listener) => {
    try {
      listener(articles);
    } catch (err) {
      console.warn('[NewsClient] Subscriber notification error:', err);
    }
  });
}

function scheduleNewsCooldownAutoRetry(delaySeconds: number) {
  if (newsCooldownTimerId) {
    clearTimeout(newsCooldownTimerId);
    newsCooldownTimerId = null;
  }

  const delayMs = Math.max(2000, (delaySeconds * 1000) + 1000); // 1s buffer after cooldown window
  console.log(`[NewsClient] auto-retry scheduled in ${Math.round(delayMs / 1000)}s.`);

  newsCooldownTimerId = setTimeout(async () => {
    newsCooldownTimerId = null;
    console.log('[NewsClient] Gemini cooldown EXPIRED: auto-retrying news sync...');
    try {
      const fresh = await fetchCricketNews(false);
      console.log(`[NewsClient] Retry completed: returned ${fresh.length} verified articles.`);
      if (fresh && fresh.length > 0) {
        notifyNewsSubscribers(fresh);
      }
    } catch (err) {
      console.warn('[NewsClient] Auto-retry news error:', err);
    }
  }, delayMs);
}

export function getCricketDataStatus() {
  return {
    connected: IS_LIVE_CRICKET_API_ENABLED,
    hasRateLimitError,
    lastError: lastFetchError,
    matchCount: cachedMatchesList.length,
    newsCount: cachedNewsList.length,
    isCooldownActive: Date.now() < clientRateLimitCooldownUntil,
    cooldownRemainingSeconds: Math.max(0, Math.ceil((clientRateLimitCooldownUntil - Date.now()) / 1000)),
    isNewsCooldownActive: Date.now() < clientNewsRateLimitCooldownUntil,
    newsCooldownRemainingSeconds: Math.max(0, Math.ceil((clientNewsRateLimitCooldownUntil - Date.now()) / 1000)),
  };
}

export interface ApiConnectionStatus {
  status: string;
  matchesApi: {
    connected: boolean;
    provider: string;
  };
  newsApi: {
    connected: boolean;
    provider: string;
  };
  geminiApi: {
    connected: boolean;
  };
}

/**
 * Checks connectivity status of backend Matches, News, and AI keys.
 */
export async function fetchApiStatus(): Promise<ApiConnectionStatus | null> {
  try {
    const res = await fetch('/api/cricket/status');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch API connection status:', err);
    return null;
  }
}

/**
 * Fetches real-time cricket matches from the server/third-party API proxy.
 * Includes live fixtures, upcoming matches, and recent results.
 */
export async function fetchCricketMatches(forceRefresh: boolean = false): Promise<MatchData[]> {
  if (!IS_LIVE_CRICKET_API_ENABLED) {
    return [];
  }

  const now = Date.now();

  // If in active rate-limit cooldown
  if (now < clientRateLimitCooldownUntil) {
    const remainingSecs = Math.max(1, Math.ceil((clientRateLimitCooldownUntil - now) / 1000));
    if (cachedMatchesList.length > 0) {
      console.log(`[CricketClient] Cache HIT: serving ${cachedMatchesList.length} verified matches during active cooldown (${remainingSecs}s remaining).`);
      return cachedMatchesList;
    }
    console.log(`[CricketClient] Cache MISS & Gemini cooldown ACTIVE: ${remainingSecs}s remaining (auto-retry armed).`);
    if (!cooldownTimerId) {
      scheduleCooldownAutoRetry(remainingSecs);
    }
    return cachedMatchesList;
  }

  // Reuse fresh client-side cache unless this is a user-initiated forced refresh
  if (!forceRefresh && cachedMatchesList.length > 0 && (now - lastMatchesClientFetchTime < CLIENT_MATCHES_CACHE_TTL_MS)) {
    console.log(`[CricketClient] Cache HIT: serving ${cachedMatchesList.length} fresh client-cached matches.`);
    return cachedMatchesList;
  }

  // Reuse pending in-flight promise to avoid duplicate concurrent calls
  if (inFlightFetchMatchesPromise) {
    console.log('[CricketClient] Deduplicating matches fetch with active in-flight request.');
    return inFlightFetchMatchesPromise;
  }

  inFlightFetchMatchesPromise = (async () => {
    try {
      console.log(`[CricketClient] Requesting /api/cricket/matches (forceRefresh=${forceRefresh})...`);
      const url = forceRefresh ? '/api/cricket/matches?refresh=true' : '/api/cricket/matches';
      const res = await fetch(url);
      const data = await res.json().catch(() => null);

      console.log(`[CricketClient] API status: ${res.status}`);

      if (!res.ok) {
        lastFetchError = data?.error || `HTTP ${res.status}: Failed to fetch matches`;
        if (res.status === 429) {
          hasRateLimitError = true;
          const retryHeader = res.headers.get('Retry-After');
          const retrySecBody = data?.retryAfterSeconds;
          let retrySec = retrySecBody || (retryHeader ? parseInt(retryHeader, 10) : 60);
          if (isNaN(retrySec) || retrySec <= 0) retrySec = 60;
          clientRateLimitCooldownUntil = Date.now() + (retrySec * 1000);
          console.warn(`[CricketClient] Gemini cooldown ACTIVE (status 429). Retry in ${retrySec}s.`);
          scheduleCooldownAutoRetry(retrySec);
        }
        return cachedMatchesList;
      }

      if (data && Array.isArray(data.matches)) {
        lastFetchError = null;
        hasRateLimitError = false;
        clientRateLimitCooldownUntil = 0;
        if (cooldownTimerId) {
          clearTimeout(cooldownTimerId);
          cooldownTimerId = null;
        }
        lastMatchesClientFetchTime = Date.now();
        console.log(`[CricketClient] Verified matches returned: ${data.matches.length} (source=${data.source}, cached=${data.cached})`);
        if (data.matches.length > 0) {
          cachedMatchesList = data.matches;
          saveCachedMatchesToStorage(data.matches);
          notifyTelemetrySubscribers(data.matches);
        }
        return data.matches;
      }
      return cachedMatchesList;
    } catch (err: any) {
      console.warn('[CricketClient] Error fetching matches from /api/cricket/matches:', err);
      lastFetchError = err?.message || 'Network error fetching matches';
      return cachedMatchesList;
    } finally {
      inFlightFetchMatchesPromise = null;
    }
  })();

  return inFlightFetchMatchesPromise;
}

/**
 * Fetches complete scorecard, player stats, commentary, and telemetry for a specific match.
 */
export async function fetchMatchById(matchId: string, forceRefresh: boolean = false): Promise<MatchData | null> {
  if (!IS_LIVE_CRICKET_API_ENABLED) {
    return null;
  }

  try {
    const url = forceRefresh
      ? `/api/cricket/matches/${encodeURIComponent(matchId)}?refresh=true`
      : `/api/cricket/matches/${encodeURIComponent(matchId)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data?.match || data;
  } catch (err) {
    console.warn(`Could not fetch match ${matchId}:`, err);
    return null;
  }
}

/**
 * Checks whether a match object contains detailed scorecard data (innings with batters/bowlers/extras).
 */
export function hasDetailedScorecard(m: MatchData | null | undefined): boolean {
  if (!m) return false;

  if (Array.isArray(m.innings) && m.innings.length > 0) {
    const hasBattersOrBowlers = m.innings.some(
      (inn) =>
        (Array.isArray(inn.batters) && inn.batters.length > 0) ||
        (Array.isArray(inn.bowlers) && inn.bowlers.length > 0) ||
        Boolean(inn.extras && inn.extras.total !== undefined && inn.extras.total !== null)
    );
    if (hasBattersOrBowlers) return true;
  }

  if (
    m.currentInnings &&
    ((Array.isArray(m.currentInnings.batters) && m.currentInnings.batters.length > 0) ||
      (Array.isArray(m.currentInnings.bowlers) && m.currentInnings.bowlers.length > 0))
  ) {
    return true;
  }

  return false;
}

/**
 * Safely merges a fresh fixture update into an existing match.
 * If prev has detailed scorecard data and fresh is fixture-only, detailed fields
 * (innings, batters, bowlers, extras, fallOfWickets, partnerships, etc.) are never overwritten.
 */
export function mergeMatchSafely(prev: MatchData, fresh: MatchData): MatchData {
  const prevHasDetails = hasDetailedScorecard(prev);
  const freshHasDetails = hasDetailedScorecard(fresh);

  // If incoming fresh match already has full verified scorecard, accept it
  if (freshHasDetails) {
    return fresh;
  }

  // If prev does not have detailed data either, take fresh
  if (!prevHasDetails) {
    return fresh;
  }

  // Prev has detailed scorecard data and fresh is fixture-only:
  // Update lightweight/live summary fields only, never overwrite detailed fields with undefined/empty fixture values
  return {
    ...prev,
    status: fresh.status || prev.status,
    statusText: fresh.statusText || prev.statusText,
    result: fresh.result || prev.result,
    crr: fresh.crr !== undefined ? fresh.crr : prev.crr,
    rrr: fresh.rrr !== undefined ? fresh.rrr : prev.rrr,
    target: fresh.target !== undefined ? fresh.target : prev.target,
    requiredRuns: fresh.requiredRuns !== undefined ? fresh.requiredRuns : prev.requiredRuns,
    requiredBalls: fresh.requiredBalls !== undefined ? fresh.requiredBalls : prev.requiredBalls,
    runRate: fresh.runRate !== undefined ? fresh.runRate : prev.runRate,
    recentBalls:
      fresh.recentBalls && fresh.recentBalls.length > 0
        ? fresh.recentBalls
        : prev.recentBalls,
    teamA: {
      ...prev.teamA,
      score: fresh.teamA?.score || prev.teamA.score,
      overs: fresh.teamA?.overs || prev.teamA.overs,
    },
    teamB: {
      ...prev.teamB,
      score: fresh.teamB?.score || prev.teamB.score,
      overs: fresh.teamB?.overs || prev.teamB.overs,
    },
    homeTeam: prev.homeTeam
      ? {
          ...prev.homeTeam,
          score:
            fresh.homeTeam?.score !== undefined
              ? fresh.homeTeam.score
              : prev.homeTeam.score,
          wickets:
            fresh.homeTeam?.wickets !== undefined
              ? fresh.homeTeam.wickets
              : prev.homeTeam.wickets,
          overs:
            fresh.homeTeam?.overs !== undefined
              ? fresh.homeTeam.overs
              : prev.homeTeam.overs,
        }
      : fresh.homeTeam,
    awayTeam: prev.awayTeam
      ? {
          ...prev.awayTeam,
          score:
            fresh.awayTeam?.score !== undefined
              ? fresh.awayTeam.score
              : prev.awayTeam.score,
          wickets:
            fresh.awayTeam?.wickets !== undefined
              ? fresh.awayTeam.wickets
              : prev.awayTeam.wickets,
          overs:
            fresh.awayTeam?.overs !== undefined
              ? fresh.awayTeam.overs
              : prev.awayTeam.overs,
        }
      : fresh.awayTeam,

    // PRESERVE existing detailed fields:
    innings: prev.innings,
    currentInnings: {
      ...prev.currentInnings,
      score: fresh.currentInnings?.score || prev.currentInnings.score,
      overs: fresh.currentInnings?.overs || prev.currentInnings.overs,
      batters: prev.currentInnings.batters,
      bowlers: prev.currentInnings.bowlers,
      extras: prev.currentInnings.extras,
      fallOfWickets: prev.currentInnings.fallOfWickets,
      partnerships: prev.currentInnings.partnerships,
      yetToBat: prev.currentInnings.yetToBat,
    },
    commentary:
      fresh.commentary && fresh.commentary.length > prev.commentary.length
        ? fresh.commentary
        : prev.commentary,
    matchSummary: prev.matchSummary || fresh.matchSummary,
    playerOfMatch: prev.playerOfMatch || fresh.playerOfMatch,
    toss: prev.toss || fresh.toss,
    tossWinner: prev.tossWinner || fresh.tossWinner,
    tossDecision: prev.tossDecision || fresh.tossDecision,
    winner: prev.winner || fresh.winner,
    margin: prev.margin || fresh.margin,
    umpires: prev.umpires || fresh.umpires,
    sources:
      prev.sources && prev.sources.length > 0 ? prev.sources : fresh.sources,
    sourceUrl: prev.sourceUrl || fresh.sourceUrl,
    lastUpdated: fresh.lastUpdated || prev.lastUpdated,
  };
}

/**
 * Fetches real-time cricket news articles.
 */
export async function fetchCricketNews(forceRefresh: boolean = false): Promise<NewsArticle[]> {
  if (!IS_LIVE_CRICKET_API_ENABLED) {
    return [];
  }

  const now = Date.now();
  const isCooldownActive = now < clientNewsRateLimitCooldownUntil;

  // 1. If currently in rate-limit cooldown:
  if (isCooldownActive) {
    const remainingSecs = Math.max(1, Math.ceil((clientNewsRateLimitCooldownUntil - now) / 1000));
    if (cachedNewsList.length > 0) {
      console.log(`[NewsClient] Cache HIT: serving ${cachedNewsList.length} verified news articles during active cooldown (${remainingSecs}s remaining).`);
      return cachedNewsList;
    }
    console.log(`[NewsClient] Cache MISS & Gemini cooldown ACTIVE: ${remainingSecs}s remaining (auto-retry armed).`);
    if (!newsCooldownTimerId) {
      scheduleNewsCooldownAutoRetry(remainingSecs);
    }
    return cachedNewsList;
  }

  // 2. Client-side caching: reuse fresh news
  if (!forceRefresh && cachedNewsList.length > 0 && (now - lastNewsClientFetchTime < CLIENT_NEWS_CACHE_TTL_MS)) {
    console.log(`[NewsClient] Cache HIT: serving ${cachedNewsList.length} fresh client-cached news articles.`);
    return cachedNewsList;
  }

  // 3. Request deduplication: reuse active in-flight request
  if (inFlightFetchNewsPromise) {
    console.log('[NewsClient] Deduplicating news request with active in-flight request.');
    return inFlightFetchNewsPromise;
  }

  inFlightFetchNewsPromise = (async () => {
    try {
      const url = forceRefresh ? '/api/cricket/news?refresh=true' : '/api/cricket/news';
      console.log(`[NewsClient] Requesting /api/cricket/news (forceRefresh=${forceRefresh})...`);
      const res = await fetch(url);
      console.log(`[NewsClient] API status: ${res.status}`);

      const retryAfterHeader = res.headers.get('Retry-After');
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 429) {
          hasRateLimitError = true;
          const retrySec = data?.retryAfterSeconds
            ? Number(data.retryAfterSeconds)
            : (retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60);
          const safeRetrySec = isNaN(retrySec) || retrySec <= 0 ? 60 : retrySec;
          clientNewsRateLimitCooldownUntil = Date.now() + (safeRetrySec * 1000);
          console.warn(`[NewsClient] Gemini cooldown ACTIVE (status 429). Retry in ${safeRetrySec}s.`);
          scheduleNewsCooldownAutoRetry(safeRetrySec);
        }
        lastFetchError = data?.error || `HTTP ${res.status}: Failed to fetch news`;
        return cachedNewsList;
      }

      if (data && Array.isArray(data.articles)) {
        lastNewsClientFetchTime = Date.now();
        lastFetchError = null;
        hasRateLimitError = false;
        clientNewsRateLimitCooldownUntil = 0;
        if (newsCooldownTimerId) {
          clearTimeout(newsCooldownTimerId);
          newsCooldownTimerId = null;
        }

        console.log(`[NewsClient] verified news count: ${data.articles.length} (source=${data.source}, cached=${data.cached})`);
        if (data.articles.length > 0) {
          cachedNewsList = data.articles;
          saveCachedNewsToStorage(data.articles);
          notifyNewsSubscribers(data.articles);
        }
        return data.articles.length > 0 ? data.articles : cachedNewsList;
      }

      return cachedNewsList;
    } catch (err: any) {
      console.warn('[NewsClient] Network or fetch error in fetchCricketNews:', err);
      lastFetchError = err?.message || 'Network error fetching news';
      return cachedNewsList;
    } finally {
      inFlightFetchNewsPromise = null;
    }
  })();

  return inFlightFetchNewsPromise;
}

/**
 * Subscribes to real-time cricket news updates.
 * Calls `onUpdate` immediately if cached news is available, and then periodically syncs.
 */
export function subscribeToCricketNews(
  onUpdate: (articles: NewsArticle[]) => void,
  intervalMs: number = 300000
): () => void {
  if (!IS_LIVE_CRICKET_API_ENABLED) {
    return () => {};
  }

  newsListeners.add(onUpdate);

  // If valid cached news exists, serve immediately so UI displays articles with zero delay
  if (cachedNewsList.length > 0) {
    console.log(`[NewsClient] Immediately serving ${cachedNewsList.length} verified cached articles to news subscriber.`);
    onUpdate(cachedNewsList);
  }

  let isMounted = true;

  const performFetch = async () => {
    if (!isMounted) return;
    if (Date.now() < clientNewsRateLimitCooldownUntil) {
      console.log('[NewsClient] News poll: Gemini cooldown active, auto-retry timer is armed.');
      return;
    }

    try {
      console.log('[NewsClient] News poll: checking for verified news updates...');
      const liveNews = await fetchCricketNews();
      if (isMounted && liveNews && liveNews.length > 0) {
        onUpdate(liveNews);
      }
    } catch (err) {
      console.warn('[NewsClient] News subscription polling error:', err);
    }
  };

  // Initial background fetch
  performFetch();

  const intervalId = setInterval(performFetch, intervalMs);

  return () => {
    isMounted = false;
    newsListeners.delete(onUpdate);
    clearInterval(intervalId);
  };
}

/**
 * Fetches structured match summary, top performers, and tactical turning points.
 */
export async function fetchMatchSummary(matchId: string): Promise<any> {
  if (!IS_LIVE_CRICKET_API_ENABLED) {
    return null;
  }

  try {
    const res = await fetch(`/api/cricket/summary/${matchId}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`Could not fetch summary for match ${matchId}:`, err);
    return null;
  }
}

/**
 * Subscribes to real-time live match telemetry.
 * Calls `onUpdate` immediately and then on a regular interval (default: 5000ms).
 * In UI-development mode, this is idle and returns a no-op unmount function.
 */
export function subscribeToCricketTelemetry(
  onUpdate: (matches: MatchData[]) => void,
  intervalMs: number = 180000
): () => void {
  if (!IS_LIVE_CRICKET_API_ENABLED) {
    return () => {};
  }

  telemetryListeners.add(onUpdate);

  // If valid cached matches exist, serve immediately so UI displays matches with zero delay
  if (cachedMatchesList.length > 0) {
    console.log(`[CricketClient] Immediately serving ${cachedMatchesList.length} verified cached matches to subscriber.`);
    onUpdate(cachedMatchesList);
  }

  let isMounted = true;

  const performFetch = async () => {
    if (!isMounted) return;
    if (Date.now() < clientRateLimitCooldownUntil) {
      console.log('[CricketClient] Telemetry poll: Gemini cooldown active, auto-retry timer is armed.');
      return;
    }

    try {
      console.log('[CricketClient] Telemetry poll: checking for match updates...');
      const liveMatches = await fetchCricketMatches();
      if (isMounted && liveMatches && liveMatches.length > 0) {
        onUpdate(liveMatches);
      }
    } catch (err) {
      console.warn('[CricketClient] Telemetry subscription polling error:', err);
    }
  };

  // Perform background check
  performFetch();

  const intervalId = setInterval(performFetch, intervalMs);

  return () => {
    isMounted = false;
    telemetryListeners.delete(onUpdate);
    clearInterval(intervalId);
  };
}
