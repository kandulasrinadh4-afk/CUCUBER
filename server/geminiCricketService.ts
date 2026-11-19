import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// ==========================================
// TYPES & SCHEMAS FOR GROUNDED CRICKET DATA
// ==========================================

export interface GroundingSource {
  title: string;
  url: string;
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
  tournament: string;
  title: string;
  matchType?: string;
  date?: string | null;
  venue: string;
  city?: string | null;
  country?: string | null;
  status: 'LIVE' | 'UPCOMING' | 'RECENT' | 'INTERRUPTED';
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
  sources: GroundingSource[];
  sourceUrl?: string;

  // Compatibility fields for existing CUCUBER UI
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
  currentInnings: {
    teamName: string;
    teamShort: string;
    score: string;
    overs: string;
    batters: any[];
    bowlers: any[];
    fallOfWickets: any[];
    partnerships: any[];
    yetToBat: any[];
    extras?: any;
    runs?: number;
    wickets?: number | null;
    runRate?: number | null;
    inningsNumber?: number;
  };
  commentary: any[];
  innings?: any[];
  lastUpdated?: string;
  toss?: string;
  matchSummary?: string;
  umpires?: string;
}

export interface GroundedMatchDetailResponse {
  source: string;
  match: NormalizedMatch | null;
  cached: boolean;
  error?: string;
  statusCode?: number;
}

export interface NormalizedNewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl?: string;
  publishedTime?: string;
  category: 'Latest' | 'For You' | 'Teams' | 'Players' | 'Tournaments' | 'Matches' | 'Breaking News';
  timeAgo: string;
  readTime: string;
  imageUrl: string;
  tags: string[];
  url?: string;
}

// ==========================================
// TEAM LOGO MAPPING HELPER
// ==========================================

const KNOWN_TEAM_LOGOS: Record<string, string> = {
  // International teams
  india: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
  ind: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
  australia: 'https://images.unsplash.com/photo-1531415074868-036b1c57e359?auto=format&fit=crop&w=120&q=80',
  aus: 'https://images.unsplash.com/photo-1531415074868-036b1c57e359?auto=format&fit=crop&w=120&q=80',
  england: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=120&q=80',
  eng: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=120&q=80',
  pakistan: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=120&q=80',
  pak: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=120&q=80',
  'south africa': 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
  sa: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
  'new zealand': 'https://images.unsplash.com/photo-1531415074868-036b1c57e359?auto=format&fit=crop&w=120&q=80',
  nz: 'https://images.unsplash.com/photo-1531415074868-036b1c57e359?auto=format&fit=crop&w=120&q=80',
  'west indies': 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=120&q=80',
  wi: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=120&q=80',
  'sri lanka': 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=120&q=80',
  sl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=120&q=80',
  bangladesh: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
  ban: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80',
  afghanistan: 'https://images.unsplash.com/photo-1531415074868-036b1c57e359?auto=format&fit=crop&w=120&q=80',
  afg: 'https://images.unsplash.com/photo-1531415074868-036b1c57e359?auto=format&fit=crop&w=120&q=80',
};

function resolveTeamLogo(teamName: string, shortName?: string): string {
  const normalized = (teamName || '').toLowerCase().trim();
  const shortNormalized = (shortName || '').toLowerCase().trim();

  if (KNOWN_TEAM_LOGOS[normalized]) return KNOWN_TEAM_LOGOS[normalized];
  if (KNOWN_TEAM_LOGOS[shortNormalized]) return KNOWN_TEAM_LOGOS[shortNormalized];

  for (const [key, url] of Object.entries(KNOWN_TEAM_LOGOS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return url;
    }
  }

  return 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80';
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Recently';
  try {
    const parsed = new Date(dateString).getTime();
    if (isNaN(parsed)) return dateString.length < 25 ? dateString : 'Recently';
    const diffMins = Math.floor((Date.now() - parsed) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

// ==========================================
// GEMINI CLIENT & RATE-LIMIT CONTROL
// ==========================================

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
];

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

function isQuotaOrRateLimitError(err: any): boolean {
  if (!err) return false;
  const str = (err.message || '') + ' ' + (err.status || '') + ' ' + JSON.stringify(err);
  return (
    str.includes('429') ||
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('quota') ||
    str.includes('rate-limit') ||
    str.includes('RATE_LIMIT')
  );
}

// Safely extracts retry-after delay in seconds from Gemini error metadata or error string
function extractRetryDelaySeconds(err: any): number {
  if (!err) return 60;

  try {
    // 1. Check details array for RetryInfo
    const details = err.errorDetails || err.details || err.error?.details;
    if (Array.isArray(details)) {
      for (const d of details) {
        if (d?.retryDelay) {
          const sec = parseFloat(d.retryDelay);
          if (!isNaN(sec) && sec > 0) return Math.ceil(sec);
        }
      }
    }

    // 2. Check message string for "retry in XXs" or "retry after XXs"
    const msg = (err.message || '') + ' ' + (typeof err === 'string' ? err : JSON.stringify(err));
    const match = msg.match(/retry\s+in\s+([0-9.]+)\s*s/i) || msg.match(/retry\s+after\s+([0-9.]+)\s*s/i);
    if (match && match[1]) {
      const sec = parseFloat(match[1]);
      if (!isNaN(sec) && sec > 0) return Math.ceil(sec);
    }
  } catch {
    // fallback
  }

  return 60; // Safe default cooldown
}

// Rate limit cooldown timestamp (ms)
let rateLimitCooldownUntil = 0;

// ==========================================
// PERSISTENT DISK CACHE HELPERS
// ==========================================

const CACHE_DIR = path.join(process.cwd(), '.cache');
const MATCHES_CACHE_FILE = path.join(CACHE_DIR, 'cricket_matches_cache.json');

function saveMatchesCacheToDisk(matches: NormalizedMatch[], timestamp: number) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(
      MATCHES_CACHE_FILE,
      JSON.stringify({ timestamp, count: matches.length, matches }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.warn('[Cache] Could not write matches cache to disk:', err);
  }
}

function loadMatchesCacheFromDisk(): { matches: NormalizedMatch[]; timestamp: number } | null {
  try {
    if (fs.existsSync(MATCHES_CACHE_FILE)) {
      const raw = fs.readFileSync(MATCHES_CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.matches) && parsed.matches.length > 0) {
        console.log(`[Cache] Restored ${parsed.matches.length} matches from disk cache.`);
        return { matches: parsed.matches, timestamp: parsed.timestamp || Date.now() };
      }
    }
  } catch (err) {
    console.warn('[Cache] Could not read matches cache from disk:', err);
  }
  return null;
}

const NEWS_CACHE_FILE = path.join(CACHE_DIR, 'cricket_news_cache.json');

function saveNewsCacheToDisk(articles: NormalizedNewsArticle[], timestamp: number) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(
      NEWS_CACHE_FILE,
      JSON.stringify({ timestamp, count: articles.length, articles }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.warn('[Cache] Could not write news cache to disk:', err);
  }
}

function loadNewsCacheFromDisk(): { articles: NormalizedNewsArticle[]; timestamp: number } | null {
  try {
    if (fs.existsSync(NEWS_CACHE_FILE)) {
      const raw = fs.readFileSync(NEWS_CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.articles) && parsed.articles.length > 0) {
        console.log(`[Cache] Restored ${parsed.articles.length} news articles from disk cache.`);
        return { articles: parsed.articles, timestamp: parsed.timestamp || Date.now() };
      }
    }
  } catch (err) {
    console.warn('[Cache] Could not read news cache from disk:', err);
  }
  return null;
}

const SCORECARDS_CACHE_FILE = path.join(CACHE_DIR, 'cricket_scorecards_cache.json');

function saveScorecardsCacheToDisk(cacheMap: Map<string, { data: NormalizedMatch; timestamp: number }>) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    const serializable: Record<string, { data: NormalizedMatch; timestamp: number }> = {};
    cacheMap.forEach((v, k) => {
      serializable[k] = v;
    });
    fs.writeFileSync(SCORECARDS_CACHE_FILE, JSON.stringify(serializable, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Cache] Could not write scorecards cache to disk:', err);
  }
}

function loadScorecardsCacheFromDisk(): Map<string, { data: NormalizedMatch; timestamp: number }> {
  const map = new Map<string, { data: NormalizedMatch; timestamp: number }>();
  try {
    if (fs.existsSync(SCORECARDS_CACHE_FILE)) {
      const raw = fs.readFileSync(SCORECARDS_CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          if (v && (v as any).data) {
            map.set(k, v as any);
          }
        }
        console.log(`[Cache] Restored ${map.size} verified scorecards from disk cache.`);
      }
    }
  } catch (err) {
    console.warn('[Cache] Could not read scorecards cache from disk:', err);
  }
  return map;
}

// ==========================================
// IN-MEMORY CACHE & REQUEST DEDUPLICATION
// ==========================================

const initialDiskData = loadMatchesCacheFromDisk();
let cachedMatches: NormalizedMatch[] = initialDiskData?.matches || [];
let lastMatchesFetchTime = initialDiskData?.timestamp || 0;
let lastForceRefreshMatchesTime = 0;
let inFlightMatchesPromise: Promise<GroundedMatchesResponse> | null = null;

const initialNewsDiskData = loadNewsCacheFromDisk();
let cachedNews: NormalizedNewsArticle[] = initialNewsDiskData?.articles || [];
let lastNewsFetchTime = initialNewsDiskData?.timestamp || 0;
let inFlightNewsPromise: Promise<GroundedNewsResponse> | null = null;

export interface GroundedMatchesResponse {
  source: string;
  count: number;
  matches: NormalizedMatch[];
  cached: boolean;
  error?: string;
  statusCode?: number;
  retryAfterSeconds?: number;
}

export interface GroundedNewsResponse {
  source: string;
  count: number;
  articles: NormalizedNewsArticle[];
  cached: boolean;
  error?: string;
  statusCode?: number;
  retryAfterSeconds?: number;
}

// ==========================================
// MATCH DATA SERVICE (GEMINI + SEARCH GROUNDING)
// ==========================================

export async function getGroundedCricketMatches(forceRefresh: boolean = false): Promise<GroundedMatchesResponse> {
  const now = Date.now();

  // Determine dynamic cache TTL:
  // If we have any live match actively in progress, refresh after 5 minutes (300s).
  // If all matches are scheduled/completed, refresh after 15 minutes (900s).
  const hasLiveMatch = cachedMatches.some((m) => m.status === 'LIVE');
  const cacheTtlMs = hasLiveMatch ? 300000 : 900000;

  // Rate-limit cooldown guard
  const isCooldownActive = now < rateLimitCooldownUntil;

  // Throttle manual force refreshes to prevent UI spamming (minimum 60s between manual force calls)
  const canForce = forceRefresh && !isCooldownActive && (now - lastForceRefreshMatchesTime > 60000);
  if (canForce) {
    lastForceRefreshMatchesTime = now;
  }

  // Return cached matches if fresh or during cooldown (stale-while-revalidate / stale-on-rate-limit)
  if ((!canForce || isCooldownActive) && cachedMatches.length > 0 && (now - lastMatchesFetchTime < cacheTtlMs || isCooldownActive)) {
    console.log(`[CricketAPI] Cache HIT: serving ${cachedMatches.length} verified matches (cooldownActive=${isCooldownActive}).`);
    return {
      source: isCooldownActive ? 'gemini_rate_limited_cached' : 'gemini_grounded_cache',
      count: cachedMatches.length,
      matches: cachedMatches,
      cached: true,
      statusCode: 200,
    };
  }

  // If rate-limited and no cache, return explicit error status code without calling Gemini
  if (isCooldownActive && cachedMatches.length === 0) {
    const retrySecs = Math.max(1, Math.ceil((rateLimitCooldownUntil - now) / 1000));
    console.log(`[CricketAPI] Cache MISS & Gemini cooldown ACTIVE: retry in ${retrySecs}s.`);
    return {
      source: 'gemini_rate_limited',
      count: 0,
      matches: [],
      cached: false,
      error: `Gemini API quota or rate limit currently active. Please retry in ${retrySecs}s.`,
      statusCode: 429,
      retryAfterSeconds: retrySecs,
    };
  }

  console.log(`[CricketAPI] Cache MISS & Gemini cooldown EXPIRED/INACTIVE: requesting verified matches via Gemini + Google Search Grounding...`);

  // Request deduplication: reuse active in-flight search
  if (inFlightMatchesPromise) {
    console.log('[CricketAPI] In-flight search request already running; attaching to pending promise.');
    return inFlightMatchesPromise;
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.error('GEMINI_API_KEY is not configured on the server.');
    return {
      source: 'unconfigured_key',
      count: cachedMatches.length,
      matches: cachedMatches,
      cached: false,
      error: 'GEMINI_API_KEY is not configured on the server.',
      statusCode: 500,
    };
  }

  inFlightMatchesPromise = (async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const prompt = `You are a real-time cricket data service. Search Google for CURRENT real-time cricket matches today (${todayStr}) and this week, covering:
1. LIVE matches actively in progress right now (International Men's/Women's, major leagues).
2. UPCOMING scheduled matches for today or the next few days.
3. RECENT results from matches completed within the last 48-72 hours with verified scores.

Search authoritative sources: ESPNcricinfo, Cricbuzz, ICC-cricket, BBC Sport, Wisden, BCCI, Cricket Australia, ECB.

CRITICAL INSTRUCTIONS:
- NEVER invent or simulate matches, scores, or results.
- If no matches are live right now, return an empty array for live matches.
- If a value cannot be verified from search results, use null instead of guessing.
- Grounding: verify status, teams, venues, scores, and overs accurately from the web.

Return your response strictly as a JSON object inside a \`\`\`json code block with the following schema:
{
  "matches": [
    {
      "id": "match-identifier-slug",
      "tournament": "Official series or tournament name",
      "title": "Match title / fixture name",
      "status": "LIVE" | "UPCOMING" | "RECENT" | "INTERRUPTED",
      "statusText": "Current situation e.g. 'Team A won by 4 wickets' or 'Team B need 32 runs in 24 balls' or 'Scheduled start at 10:30 AM GMT'",
      "venue": "Ground name and city",
      "startTime": "Scheduled date/time ISO string or null",
      "homeTeam": {
        "name": "Full team name",
        "shortName": "3-4 letter abbreviation (e.g. IND, ENG, AUS)",
        "score": "e.g. 185/4 or null if not yet batted",
        "wickets": 4 or null,
        "overs": "18.2" or null
      },
      "awayTeam": {
        "name": "Full team name",
        "shortName": "3-4 letter abbreviation",
        "score": "e.g. 192/6 or null",
        "wickets": 6 or null,
        "overs": "20.0" or null
      },
      "target": number or null,
      "requiredRuns": number or null,
      "requiredBalls": number or null,
      "runRate": number or null,
      "result": "Final match result statement if completed, else null"
    }
  ]
}`;

      let lastError: any = null;
      let responseText: string | undefined;
      let groundingSources: GroundingSource[] = [];

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });

          responseText = response.text;

          // Extract grounding chunks from metadata
          const metadata = response.candidates?.[0]?.groundingMetadata;
          if (metadata?.groundingChunks && Array.isArray(metadata.groundingChunks)) {
            groundingSources = metadata.groundingChunks
              .map((chunk: any) => {
                const uri = chunk.web?.uri || chunk.web?.url;
                const title = chunk.web?.title || 'Web Search Result';
                if (uri) return { title, url: uri };
                return null;
              })
              .filter(Boolean) as GroundingSource[];
          }

          if (responseText) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          // If rate limited or quota exceeded, do NOT attempt other candidate models!
          if (isQuotaOrRateLimitError(err)) {
            const retrySecs = extractRetryDelaySeconds(err);
            rateLimitCooldownUntil = Date.now() + (retrySecs * 1000);
            console.warn(`Gemini API rate limit reached during matches search. Cooling down for ${retrySecs} seconds.`);
            break;
          }
          console.warn(`Gemini search with model ${modelName} failed, trying next candidate:`, err?.message || err);
        }
      }

      if (!responseText) {
        if (cachedMatches.length > 0) {
          console.log(`[CricketAPI] Cache HIT (fallback): serving ${cachedMatches.length} verified matches.`);
          return {
            source: 'gemini_grounded_cache',
            count: cachedMatches.length,
            matches: cachedMatches,
            cached: true,
            statusCode: 200,
          };
        }
        const isRateLimit = isQuotaOrRateLimitError(lastError);
        const retrySecs = isRateLimit ? extractRetryDelaySeconds(lastError) : 60;
        console.warn(`[CricketAPI] No response text received. (isRateLimit=${isRateLimit}, retryIn=${retrySecs}s)`);
        return {
          source: isRateLimit ? 'gemini_rate_limited' : 'gemini_empty_fallback',
          count: 0,
          matches: [],
          cached: false,
          error: isRateLimit
            ? `Gemini API rate limit reached (429). Please retry in ${retrySecs}s.`
            : (lastError?.message || 'No response received from Gemini search grounding.'),
          statusCode: isRateLimit ? 429 : 502,
          retryAfterSeconds: isRateLimit ? retrySecs : undefined,
        };
      }

      // Parse structured JSON
      const parsedData = extractJsonFromText(responseText);
      if (!parsedData || !Array.isArray(parsedData.matches)) {
        if (cachedMatches.length > 0) {
          return {
            source: 'gemini_grounded_cache',
            count: cachedMatches.length,
            matches: cachedMatches,
            cached: true,
            statusCode: 200,
          };
        }
        return {
          source: 'gemini_parse_fallback',
          count: 0,
          matches: [],
          cached: false,
          error: 'Gemini response could not be parsed into verified match structure.',
          statusCode: 502,
        };
      }

      // Normalize each grounded match
      const normalizedList: NormalizedMatch[] = parsedData.matches.map((item: any, idx: number) => {
        const homeName = item.homeTeam?.name || 'Home Team';
        const homeShort = item.homeTeam?.shortName || homeName.slice(0, 3).toUpperCase();
        const awayName = item.awayTeam?.name || 'Away Team';
        const awayShort = item.awayTeam?.shortName || awayName.slice(0, 3).toUpperCase();

        const homeLogo = resolveTeamLogo(homeName, homeShort);
        const awayLogo = resolveTeamLogo(awayName, awayShort);

        const status = (item.status === 'LIVE' || item.status === 'UPCOMING' || item.status === 'RECENT' || item.status === 'INTERRUPTED')
          ? item.status
          : 'UPCOMING';

        const homeScoreStr = item.homeTeam?.score || (status === 'UPCOMING' ? 'Scheduled' : 'Yet to bat');
        const homeOversStr = item.homeTeam?.overs || '0.0';
        const awayScoreStr = item.awayTeam?.score || undefined;
        const awayOversStr = item.awayTeam?.overs || undefined;

        const fallbackStatusText = status === 'LIVE'
          ? (item.requiredRuns ? `Need ${item.requiredRuns} runs in ${item.requiredBalls || 0} balls` : 'Live match in progress')
          : status === 'RECENT'
          ? (item.result || 'Match Concluded')
          : (item.startTime ? `Scheduled: ${item.startTime}` : 'Scheduled fixture');

        const stableId = (item.id || `${homeShort.toLowerCase()}-vs-${awayShort.toLowerCase()}-${idx}`)
          .replace(/[^a-zA-Z0-9_-]/g, '-');

        return {
          id: stableId,
          tournament: item.tournament || 'International Cricket',
          title: item.title || `${homeName} vs ${awayName} • ${item.venue || 'Cricket Ground'}`,
          status,
          startTime: item.startTime || null,
          venue: item.venue || 'International Cricket Stadium',
          homeTeam: {
            name: homeName,
            shortName: homeShort,
            score: item.homeTeam?.score || null,
            wickets: item.homeTeam?.wickets !== undefined ? item.homeTeam.wickets : null,
            overs: item.homeTeam?.overs || null,
            logo: homeLogo,
          },
          awayTeam: {
            name: awayName,
            shortName: awayShort,
            score: item.awayTeam?.score || null,
            wickets: item.awayTeam?.wickets !== undefined ? item.awayTeam.wickets : null,
            overs: item.awayTeam?.overs || null,
            logo: awayLogo,
          },
          target: item.target !== undefined ? item.target : null,
          requiredRuns: item.requiredRuns !== undefined ? item.requiredRuns : null,
          requiredBalls: item.requiredBalls !== undefined ? item.requiredBalls : null,
          runRate: item.runRate !== undefined ? item.runRate : null,
          result: item.result || null,
          statusText: item.statusText || fallbackStatusText,
          sources: groundingSources,
          sourceUrl: groundingSources[0]?.url,

          // CUCUBER UI Expected Properties
          teamA: {
            name: homeName,
            shortName: homeShort,
            logo: homeLogo,
            score: homeScoreStr,
            overs: homeOversStr,
          },
          teamB: {
            name: awayName,
            shortName: awayShort,
            logo: awayLogo,
            score: awayScoreStr,
            overs: awayOversStr,
          },
          crr: item.runRate || undefined,
          rrr: (item.requiredRuns && item.requiredBalls && item.requiredBalls > 0)
            ? parseFloat(((item.requiredRuns / (item.requiredBalls / 6))).toFixed(2))
            : undefined,
          recentBalls: [],
          currentInnings: {
            teamName: homeName,
            teamShort: homeShort,
            score: homeScoreStr,
            overs: homeOversStr,
            batters: [],
            bowlers: [],
            fallOfWickets: [],
            partnerships: [],
            yetToBat: [],
          },
          commentary: [],
        };
      });

      if (normalizedList.length > 0) {
        cachedMatches = normalizedList;
        lastMatchesFetchTime = now;
        saveMatchesCacheToDisk(cachedMatches, lastMatchesFetchTime);
        console.log(`[CricketAPI] Gemini Search Grounding SUCCESS: ${normalizedList.length} verified matches returned and cached.`);
      } else {
        console.log(`[CricketAPI] Gemini Search Grounding returned 0 matches.`);
      }

      return {
        source: 'gemini_grounded_web',
        count: normalizedList.length,
        matches: normalizedList,
        cached: false,
        statusCode: 200,
      };
    } catch (err: any) {
      console.error('[CricketAPI] Gemini search grounding error:', err?.message || err);
      const isRateLimit = isQuotaOrRateLimitError(err);
      const retrySecs = isRateLimit ? extractRetryDelaySeconds(err) : 60;
      if (isRateLimit) {
        rateLimitCooldownUntil = Date.now() + (retrySecs * 1000);
        console.warn(`[CricketAPI] Gemini API rate limit cooldown activated (${retrySecs}s).`);
      }

      if (cachedMatches.length > 0) {
        console.log(`[CricketAPI] Cache HIT (stale on error): serving ${cachedMatches.length} verified matches.`);
        return {
          source: 'gemini_grounded_cache',
          count: cachedMatches.length,
          matches: cachedMatches,
          cached: true,
          error: isRateLimit ? 'Served cached matches due to active rate limit.' : 'Served cached matches due to search grounding error.',
          statusCode: 200,
        };
      }

      return {
        source: isRateLimit ? 'gemini_rate_limited' : 'gemini_error',
        count: 0,
        matches: [],
        cached: false,
        error: isRateLimit
          ? `Gemini API rate limit reached (429). Please retry in ${retrySecs}s.`
          : (err?.message || 'Failed to retrieve grounded cricket matches.'),
        statusCode: isRateLimit ? 429 : 502,
        retryAfterSeconds: isRateLimit ? retrySecs : undefined,
      };
    } finally {
      inFlightMatchesPromise = null;
    }
  })();

  return inFlightMatchesPromise;
}

// ==========================================
// MATCH DETAILS SERVICE (GEMINI + SEARCH GROUNDING)
// ==========================================

const matchDetailsCache = loadScorecardsCacheFromDisk();
const inFlightMatchDetailsPromises = new Map<string, Promise<GroundedMatchDetailResponse>>();

function normalizeSingleInnings(
  rawInn: any,
  defaultTeamName: string,
  defaultTeamShort: string,
  fallbackScore?: string,
  fallbackOvers?: string,
  inningsNum?: number
) {
  const teamName = rawInn?.teamName || defaultTeamName;
  const teamShort = rawInn?.teamShort || defaultTeamShort || (teamName.length > 3 ? teamName.slice(0, 3).toUpperCase() : teamName.toUpperCase());
  const rawScore = rawInn?.score || fallbackScore || '';
  const oversStr = String(rawInn?.overs || fallbackOvers || '0.0');

  // Extract runs & wickets
  let runs: number | undefined = undefined;
  let wickets: number | null = null;
  if (typeof rawInn?.runs === 'number') {
    runs = rawInn.runs;
  }
  if (typeof rawInn?.wickets === 'number') {
    wickets = rawInn.wickets;
  } else if (rawScore) {
    const parts = rawScore.split('/');
    if (parts.length >= 2) {
      const r = parseInt(parts[0], 10);
      const w = parseInt(parts[1], 10);
      if (!isNaN(r)) runs = r;
      if (!isNaN(w)) wickets = w;
    } else {
      const r = parseInt(rawScore, 10);
      if (!isNaN(r)) runs = r;
    }
  }

  // Calculate run rate
  let runRate: number | null = null;
  if (typeof rawInn?.runRate === 'number') {
    runRate = rawInn.runRate;
  } else if (runs !== undefined && oversStr) {
    const ovParts = oversStr.split('.');
    const compOvers = parseInt(ovParts[0], 10) || 0;
    const balls = parseInt(ovParts[1], 10) || 0;
    const totalOvers = compOvers + balls / 6;
    if (totalOvers > 0) {
      runRate = parseFloat((runs / totalOvers).toFixed(2));
    }
  }

  // Normalize Batters
  const batters = Array.isArray(rawInn?.batters)
    ? rawInn.batters.map((b: any) => {
        const bRuns = typeof b.runs === 'number' ? b.runs : parseInt(b.runs || '0', 10);
        const bBalls = typeof b.balls === 'number' ? b.balls : parseInt(b.balls || '0', 10);
        const bFours = typeof b.fours === 'number' ? b.fours : parseInt(b.fours || '0', 10);
        const bSixes = typeof b.sixes === 'number' ? b.sixes : parseInt(b.sixes || '0', 10);

        let sr = typeof b.sr === 'number' ? b.sr : parseFloat(b.sr || '0');
        if ((!sr || isNaN(sr)) && !isNaN(bRuns) && !isNaN(bBalls) && bBalls > 0) {
          sr = parseFloat(((bRuns / bBalls) * 100).toFixed(2));
        }

        const isNotOut = !!(
          b.isNotOut ||
          (b.dismissal && b.dismissal.toLowerCase().includes('not out')) ||
          (b.isStriker && !b.dismissal)
        );

        let dismissal = b.dismissal;
        if (isNotOut) {
          dismissal = 'NOT OUT';
        } else if (!dismissal) {
          dismissal = '—';
        }

        return {
          name: b.name || 'Batter',
          runs: isNaN(bRuns) ? 0 : bRuns,
          balls: isNaN(bBalls) ? 0 : bBalls,
          fours: isNaN(bFours) ? 0 : bFours,
          sixes: isNaN(bSixes) ? 0 : bSixes,
          sr: isNaN(sr) ? 0 : sr,
          isStriker: !!b.isStriker,
          isNotOut,
          dismissal,
        };
      })
    : [];

  // Normalize Bowlers
  const bowlers = Array.isArray(rawInn?.bowlers)
    ? rawInn.bowlers.map((bw: any) => {
        const overs = bw.overs !== undefined ? bw.overs : '—';
        const maidens = typeof bw.maidens === 'number' ? bw.maidens : parseInt(bw.maidens || '0', 10) || 0;
        const bwRuns = typeof bw.runs === 'number' ? bw.runs : parseInt(bw.runs || '0', 10) || 0;
        const bwWickets = typeof bw.wickets === 'number' ? bw.wickets : parseInt(bw.wickets || '0', 10) || 0;
        let economy = typeof bw.economy === 'number' ? bw.economy : parseFloat(bw.economy || '0');
        if ((!economy || isNaN(economy)) && typeof overs === 'number' && overs > 0) {
          economy = parseFloat((bwRuns / overs).toFixed(2));
        }
        const wides = typeof bw.wides === 'number' ? bw.wides : parseInt(bw.wides || '0', 10) || 0;
        const noBalls = typeof bw.noBalls === 'number' ? bw.noBalls : parseInt(bw.noBalls || '0', 10) || 0;

        return {
          name: bw.name || 'Bowler',
          overs,
          maidens,
          runs: bwRuns,
          wickets: bwWickets,
          economy: isNaN(economy) ? 0 : economy,
          wides,
          noBalls,
          isBowling: !!bw.isBowling,
        };
      })
    : [];

  // Normalize Extras
  const rawExtras = rawInn?.extras;
  const wides = typeof rawExtras?.wides === 'number' ? rawExtras.wides : 0;
  const noBalls = typeof rawExtras?.noBalls === 'number' ? rawExtras.noBalls : 0;
  const byes = typeof rawExtras?.byes === 'number' ? rawExtras.byes : 0;
  const legByes = typeof rawExtras?.legByes === 'number' ? rawExtras.legByes : 0;
  const penalty = typeof rawExtras?.penalty === 'number' ? rawExtras.penalty : 0;
  const total = typeof rawExtras?.total === 'number'
    ? rawExtras.total
    : wides + noBalls + byes + legByes + penalty;

  const extras = rawExtras
    ? {
        wides,
        noBalls,
        byes,
        legByes,
        penalty,
        total,
        details: rawExtras.details || `b ${byes}, lb ${legByes}, w ${wides}, nb ${noBalls}, p ${penalty}`,
      }
    : undefined;

  // Fall of wickets
  const fallOfWickets = Array.isArray(rawInn?.fallOfWickets)
    ? rawInn.fallOfWickets.map((f: any, fIdx: number) => ({
        batter: f.batter || '',
        score: f.score || '',
        over: f.over || '',
        wicketNumber: typeof f.wicketNumber === 'number' ? f.wicketNumber : fIdx + 1,
      }))
    : [];

  // Partnerships
  const partnerships = Array.isArray(rawInn?.partnerships)
    ? rawInn.partnerships.map((p: any) => ({
        batters: p.batters || '',
        runs: typeof p.runs === 'number' ? p.runs : parseInt(p.runs || '0', 10) || 0,
        balls: typeof p.balls === 'number' ? p.balls : parseInt(p.balls || '0', 10) || 0,
      }))
    : [];

  const yetToBat = Array.isArray(rawInn?.yetToBat) ? rawInn.yetToBat : [];

  return {
    inningsNumber: rawInn?.inningsNumber || inningsNum,
    teamName,
    teamShort,
    score: rawScore,
    runs,
    wickets,
    overs: oversStr,
    runRate,
    batters,
    bowlers,
    fallOfWickets,
    partnerships,
    yetToBat,
    extras,
  };
}

export async function getGroundedMatchDetails(
  matchId: string,
  forceRefresh: boolean = false
): Promise<GroundedMatchDetailResponse> {
  const now = Date.now();

  // 1. Ensure fixtures exist in cachedMatches or fetch them
  if (cachedMatches.length === 0) {
    try {
      await getGroundedCricketMatches(false);
    } catch (err) {
      console.warn('Could not preload matches for match details lookup:', err);
    }
  }

  // 2. Find base match in memory
  let baseMatch = cachedMatches.find((m) => m.id === matchId);
  if (!baseMatch) {
    const normId = (matchId || '').toLowerCase().trim();
    baseMatch = cachedMatches.find(
      (m) =>
        m.id.toLowerCase() === normId ||
        m.id.toLowerCase().includes(normId) ||
        normId.includes(m.id.toLowerCase()) ||
        `${m.homeTeam.shortName}-vs-${m.awayTeam.shortName}`.toLowerCase() === normId ||
        `${m.awayTeam.shortName}-vs-${m.homeTeam.shortName}`.toLowerCase() === normId ||
        `${m.teamA.shortName}-vs-${m.teamB.shortName}`.toLowerCase() === normId
    );
  }

  // Check detail cache even if match is not currently in fixtures list
  const cachedDetail = matchDetailsCache.get(matchId);
  if (!baseMatch && cachedDetail) {
    return {
      source: 'gemini_grounded_cache',
      match: cachedDetail.data,
      cached: true,
      statusCode: 200,
    };
  }

  if (!baseMatch) {
    return {
      source: 'not_found',
      match: null,
      cached: false,
      error: `Match with ID "${matchId}" not found in current fixtures.`,
      statusCode: 404,
    };
  }

  // 3. Cache TTL: Live matches refresh after 60s, recent completed matches cache for 24h
  const isLive = baseMatch.status === 'LIVE' || baseMatch.status === 'INTERRUPTED';
  const cacheTtlMs = isLive ? 60000 : 86400000;
  const isCooldownActive = now < rateLimitCooldownUntil;

  const hasCompleteScorecard = !!(
    cachedDetail &&
    ((cachedDetail.data.currentInnings?.batters?.length || 0) > 0 ||
      (cachedDetail.data.innings && cachedDetail.data.innings.some((inn) => inn.batters?.length > 0)))
  );

  // Return cached details if still fresh or during cooldown (never replace valid scorecard with empty)
  if ((!forceRefresh || isCooldownActive) && cachedDetail && hasCompleteScorecard) {
    if (now - cachedDetail.timestamp < cacheTtlMs || isCooldownActive || baseMatch.status === 'RECENT') {
      return {
        source: isCooldownActive ? 'gemini_rate_limited_cached' : 'gemini_grounded_cache',
        match: cachedDetail.data,
        cached: true,
        statusCode: 200,
      };
    }
  }

  // If rate limit active and no detailed cache exists, return the base match with a status note
  if (isCooldownActive && !cachedDetail) {
    const retrySecs = Math.max(1, Math.ceil((rateLimitCooldownUntil - now) / 1000));
    return {
      source: 'gemini_rate_limited',
      match: {
        ...baseMatch,
        statusText: `${baseMatch.statusText} (Syncing detailed scorecard in ${retrySecs}s...)`,
      },
      cached: false,
      error: `Gemini API rate limit cooldown active. Retry in ${retrySecs}s.`,
      statusCode: 200,
    };
  }

  // 4. Request Deduplication
  if (inFlightMatchDetailsPromises.has(matchId)) {
    return inFlightMatchDetailsPromises.get(matchId)!;
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.error('GEMINI_API_KEY is not configured on the server.');
    return {
      source: 'unconfigured_key',
      match: cachedDetail?.data || baseMatch,
      cached: false,
      error: 'GEMINI_API_KEY is not configured on the server.',
      statusCode: 500,
    };
  }

  const detailPromise = (async (): Promise<GroundedMatchDetailResponse> => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const matchContext = `${baseMatch.homeTeam.name} vs ${baseMatch.awayTeam.name}`;
      const tournamentContext = baseMatch.tournament || 'International Cricket';
      const venueContext = baseMatch.venue || 'Cricket Stadium';
      const currentStatus = baseMatch.status;

      const prompt = `Search Google for real-time, verified current cricket match details and complete scorecard:
Match: ${matchContext}
Tournament: ${tournamentContext}
Venue: ${venueContext}
Current Status: ${currentStatus}
Today's Date: ${todayStr}

Search Google for live cricket scores, full scorecard, batting figures, bowling figures, extras, dismissals, toss, and commentary from verified sports journalism sources (ESPNcricinfo, BBC Sport, Cricbuzz, ICC Cricket, Sky Sports, Wisden).

CRITICAL GROUNDING & SCORECARD RULES:
1. Ground all data strictly in actual search results for "${matchContext}". NEVER invent or simulate statistics.
2. If a statistic cannot be verified from search results, use null or omit instead of guessing.
3. INNINGS: Provide the COMPLETE scorecard for ALL innings that have been played or are in progress.
   - For a completed match (status "RECENT"), provide BOTH innings (1st innings and 2nd innings) with all batters and bowlers.
   - For a live match ("LIVE" / "INTERRUPTED"), provide the current innings in full, plus the previous completed innings if one has finished.
   - For an upcoming match ("UPCOMING"), provide venue, scheduled start time, tournament, and squads or playing XIs if announced.
4. BATTING: For EVERY player who batted in an innings:
   - Provide "name", "runs" (integer), "balls" (integer), "fours" (integer 4s), "sixes" (integer 6s), "sr" (strike rate).
   - Provide "dismissal": exact verified dismissal string (e.g. "c ... b ...", "b ...", "lbw b ...", "run out (...)", "st ... b ...", "hit wicket b ...").
   - IF THE PLAYER WAS NOT DISMISSED, explicitly set dismissal: "NOT OUT" (do NOT mark NOT OUT unless confirmed by source or active batter).
5. BOWLING: For EVERY bowler who bowled:
   - Provide "name", "overs" (e.g. 10.0 or 4), "maidens" (integer), "runs" (integer), "wickets" (integer), "economy" (float), "wides" (integer or 0), "noBalls" (integer or 0).
6. EXTRAS:
   - Provide exact breakdown: "wides", "noBalls", "byes", "legByes", "penalty", "total", "details" (e.g. "w 4, nb 1, b 0, lb 2, p 0").
7. MATCH SUMMARY & AWARDS:
   - "matchType": "ODI" | "T20" | "T20I" | "Test" | "List A"
   - "result": Winning statement (e.g. "England won by 223 runs", "India won by 6 wickets")
   - "winner": Full team name of the winner, or null if tied/abandoned/live
   - "margin": Winning margin (e.g. "223 runs", "6 wickets", "DLS method")
   - "tossWinner": Team name that won the toss
   - "tossDecision": "bat" | "bowl"
   - "toss": Full sentence (e.g. "Sri Lanka won the toss and elected to bowl")
   - "playerOfMatch": Name of Player of the Match ONLY if officially awarded/verified, else null
   - "city": City of venue (e.g. "London", "Melbourne")
   - "country": Country of venue
   - "matchSummary": 2-3 sentence authoritative tactical summary of the match
   - "umpires": Umpires names if verified

JSON Schema:
{
  "matchType": "ODI" | "T20" | "T20I" | "Test" | "List A",
  "status": "LIVE" | "UPCOMING" | "RECENT" | "INTERRUPTED",
  "statusText": "Verified situation or result text",
  "result": "Winning statement if completed, else null",
  "winner": "Winning team name or null",
  "margin": "Winning margin or null",
  "tournament": "${tournamentContext}",
  "venue": "${venueContext}",
  "city": "City or null",
  "country": "Country or null",
  "startTime": "Scheduled ISO or formatted time string if upcoming, else null",
  "tossWinner": "Toss winner or null",
  "tossDecision": "bat | bowl or null",
  "toss": "Full toss text or null",
  "playerOfMatch": "Player of Match or null",
  "matchSummary": "Verified summary of the match",
  "umpires": "Umpires names if known or null",
  "homeTeam": {
    "name": "${baseMatch.homeTeam.name}",
    "shortName": "${baseMatch.homeTeam.shortName}",
    "score": "Score string e.g. 358/8",
    "overs": "Overs string e.g. 50.0",
    "wickets": 8
  },
  "awayTeam": {
    "name": "${baseMatch.awayTeam.name}",
    "shortName": "${baseMatch.awayTeam.shortName}",
    "score": "Score string e.g. 135",
    "overs": "Overs string e.g. 25.1",
    "wickets": 10
  },
  "target": 359,
  "crr": 7.16,
  "rrr": null,
  "projectedScore": null,
  "recentBalls": ["1", "4", "0", "W", "2", "6"],
  "innings": [
    {
      "inningsNumber": 1,
      "teamName": "1st Batting Team Name",
      "teamShort": "Short code",
      "score": "358/8",
      "runs": 358,
      "wickets": 8,
      "overs": "50.0",
      "runRate": 7.16,
      "batters": [
        {
          "name": "Batter Name",
          "runs": 126,
          "balls": 105,
          "fours": 16,
          "sixes": 5,
          "sr": 120.0,
          "dismissal": "c Player b Bowler",
          "isStriker": false,
          "isNotOut": false
        }
      ],
      "bowlers": [
        {
          "name": "Bowler Name",
          "overs": 9.0,
          "maidens": 0,
          "runs": 64,
          "wickets": 3,
          "economy": 7.11,
          "wides": 2,
          "noBalls": 0,
          "isBowling": false
        }
      ],
      "extras": {
        "wides": 4,
        "noBalls": 1,
        "byes": 0,
        "legByes": 2,
        "penalty": 0,
        "total": 7,
        "details": "b 0, lb 2, w 4, nb 1"
      },
      "fallOfWickets": [
        { "batter": "Batter Name", "score": "0/1", "over": "0.5", "wicketNumber": 1 }
      ],
      "partnerships": [
        { "batters": "Batter 1 & Batter 2", "runs": 120, "balls": 98 }
      ],
      "yetToBat": ["Player Name"]
    }
  ],
  "commentary": [
    {
      "id": "c-1",
      "overNumber": "19.3",
      "runs": 4,
      "isWicket": false,
      "isBoundary": true,
      "isSix": false,
      "isMilestone": false,
      "bowler": "Bowler Name",
      "batter": "Batter Name",
      "description": "FOUR! Drilled through the covers for a boundary.",
      "timestamp": "Just now"
    }
  ]
}
`;

      let lastError: any = null;
      let responseText: string | undefined;
      let groundingSources: GroundingSource[] = [];

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });

          responseText = response.text;

          const metadata = response.candidates?.[0]?.groundingMetadata;
          if (metadata?.groundingChunks && Array.isArray(metadata.groundingChunks)) {
            groundingSources = metadata.groundingChunks
              .map((chunk: any) => {
                const uri = chunk.web?.uri || chunk.web?.url;
                const title = chunk.web?.title || 'Cricket Scorecard Source';
                if (uri) return { title, url: uri };
                return null;
              })
              .filter(Boolean) as GroundingSource[];
          }

          if (responseText) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          if (isQuotaOrRateLimitError(err)) {
            rateLimitCooldownUntil = Date.now() + 60000;
            console.warn('Gemini API rate limit reached during match detail search. Cooling down for 60 seconds.');
            break;
          }
          console.warn(`Gemini match detail search with ${modelName} failed, trying next candidate:`, err?.message || err);
        }
      }

      if (!responseText) {
        if (cachedDetail) {
          return {
            source: 'gemini_grounded_cache',
            match: cachedDetail.data,
            cached: true,
            statusCode: 200,
          };
        }
        return {
          source: 'gemini_grounded_fallback',
          match: baseMatch,
          cached: false,
          error: lastError?.message || 'Unable to retrieve live match scorecard at this moment.',
          statusCode: 200,
        };
      }

      const parsedData = extractJsonFromText(responseText);
      if (!parsedData) {
        if (cachedDetail) {
          return {
            source: 'gemini_grounded_cache',
            match: cachedDetail.data,
            cached: true,
            statusCode: 200,
          };
        }
        return {
          source: 'gemini_parse_fallback',
          match: baseMatch,
          cached: false,
          error: 'Could not parse verified scorecard data.',
          statusCode: 200,
        };
      }

      const validatedStatus: 'LIVE' | 'UPCOMING' | 'RECENT' | 'INTERRUPTED' =
        parsedData.status === 'LIVE' ||
        parsedData.status === 'UPCOMING' ||
        parsedData.status === 'RECENT' ||
        parsedData.status === 'INTERRUPTED'
          ? parsedData.status
          : baseMatch.status;

      // Extract & Normalize All Innings
      let allInnings: any[] = [];
      if (Array.isArray(parsedData.innings) && parsedData.innings.length > 0) {
        allInnings = parsedData.innings.map((rawInn: any, idx: number) => {
          const fallbackTeam = idx === 0 ? baseMatch.homeTeam.name : baseMatch.awayTeam.name;
          const fallbackShort = idx === 0 ? baseMatch.homeTeam.shortName : baseMatch.awayTeam.shortName;
          return normalizeSingleInnings(rawInn, fallbackTeam, fallbackShort, undefined, undefined, idx + 1);
        });
      } else {
        // Fallback using currentInnings and previousInnings
        if (parsedData.previousInnings && parsedData.previousInnings.teamName) {
          allInnings.push(
            normalizeSingleInnings(
              parsedData.previousInnings,
              baseMatch.homeTeam.name,
              baseMatch.homeTeam.shortName,
              undefined,
              undefined,
              1
            )
          );
        }
        if (parsedData.currentInnings) {
          allInnings.push(
            normalizeSingleInnings(
              parsedData.currentInnings,
              baseMatch.awayTeam.name,
              baseMatch.awayTeam.shortName,
              validatedStatus === 'UPCOMING' ? 'Scheduled' : baseMatch.teamA.score,
              baseMatch.teamA.overs,
              allInnings.length + 1
            )
          );
        }
      }

      // If no innings could be parsed, build a minimal current innings
      if (allInnings.length === 0) {
        allInnings.push(
          normalizeSingleInnings(
            {},
            baseMatch.homeTeam.name,
            baseMatch.homeTeam.shortName,
            validatedStatus === 'UPCOMING' ? 'Scheduled' : baseMatch.teamA.score,
            baseMatch.teamA.overs,
            1
          )
        );
      }

      const normalizedCurrentInnings = allInnings[allInnings.length - 1] || allInnings[0];

      // Normalize Commentary
      const normalizedCommentary = Array.isArray(parsedData.commentary)
        ? parsedData.commentary.map((c: any, cIdx: number) => ({
            id: c.id || `comm-${cIdx}-${Date.now()}`,
            overNumber: c.overNumber || `${cIdx + 1}.0`,
            runs: typeof c.runs === 'number' ? c.runs : parseInt(c.runs || '0', 10) || 0,
            isWicket: !!c.isWicket,
            isBoundary: !!c.isBoundary,
            isSix: !!c.isSix,
            isMilestone: !!c.isMilestone,
            milestoneTitle: c.milestoneTitle || undefined,
            bowler: c.bowler || '',
            batter: c.batter || '',
            description: c.description || (c.isWicket ? 'WICKET!' : c.isSix ? 'SIX!' : c.isBoundary ? 'FOUR!' : `${c.runs || 0} run`),
            timestamp: c.timestamp || 'Recent',
            tag: c.tag || (c.isWicket ? 'Wicket' : c.isSix ? 'Six' : c.isBoundary ? 'Four' : undefined),
          }))
        : [];

      // Extract recent balls from commentary if provided or commentary has balls
      const recentBalls = Array.isArray(parsedData.recentBalls) && parsedData.recentBalls.length > 0
        ? parsedData.recentBalls
        : normalizedCommentary.slice(0, 6).map((b) => (b.isWicket ? 'W' : b.isSix ? '6' : b.isBoundary ? '4' : `${b.runs}`));

      const homeScore = validatedStatus === 'UPCOMING'
        ? 'Scheduled'
        : (parsedData.homeTeam?.score || baseMatch.teamA.score);
      const homeOvers = validatedStatus === 'UPCOMING'
        ? '0.0'
        : (parsedData.homeTeam?.overs || baseMatch.teamA.overs);
      const awayScore = validatedStatus === 'UPCOMING'
        ? undefined
        : (parsedData.awayTeam?.score || baseMatch.teamB.score);
      const awayOvers = validatedStatus === 'UPCOMING'
        ? undefined
        : (parsedData.awayTeam?.overs || baseMatch.teamB.overs);

      const combinedSources = groundingSources.length > 0
        ? groundingSources
        : baseMatch.sources;

      const detailedMatch: NormalizedMatch = {
        ...baseMatch,
        id: baseMatch.id, // Strictly preserve original ID
        matchId: baseMatch.id,
        title: parsedData.tournament
          ? `${baseMatch.homeTeam.name} vs ${baseMatch.awayTeam.name} • ${parsedData.venue || baseMatch.venue}`
          : baseMatch.title,
        tournament: parsedData.tournament || baseMatch.tournament,
        venue: parsedData.venue || baseMatch.venue,
        matchType: parsedData.matchType || undefined,
        city: parsedData.city || undefined,
        country: parsedData.country || undefined,
        status: validatedStatus,
        statusText: parsedData.statusText || baseMatch.statusText,
        result: parsedData.result || baseMatch.result,
        winner: parsedData.winner || undefined,
        margin: parsedData.margin || undefined,
        startTime: parsedData.startTime || baseMatch.startTime,
        tossWinner: parsedData.tossWinner || undefined,
        tossDecision: parsedData.tossDecision || undefined,
        toss: parsedData.toss || undefined,
        playerOfMatch: parsedData.playerOfMatch || undefined,
        matchSummary: parsedData.matchSummary || undefined,
        umpires: parsedData.umpires || undefined,
        lastUpdated: new Date().toISOString(),
        teamA: {
          name: baseMatch.homeTeam.name,
          shortName: baseMatch.homeTeam.shortName,
          logo: baseMatch.homeTeam.logo,
          score: homeScore,
          overs: homeOvers,
        },
        teamB: {
          name: baseMatch.awayTeam.name,
          shortName: baseMatch.awayTeam.shortName,
          logo: baseMatch.awayTeam.logo,
          score: awayScore,
          overs: awayOvers,
        },
        homeTeam: {
          ...baseMatch.homeTeam,
          score: homeScore,
          overs: homeOvers,
        },
        awayTeam: {
          ...baseMatch.awayTeam,
          score: awayScore || null,
          overs: awayOvers || null,
        },
        crr: typeof parsedData.crr === 'number' ? parsedData.crr : baseMatch.crr,
        rrr: typeof parsedData.rrr === 'number' ? parsedData.rrr : baseMatch.rrr,
        target: typeof parsedData.target === 'number' ? parsedData.target : baseMatch.target,
        projectedScore: typeof parsedData.projectedScore === 'number' ? parsedData.projectedScore : baseMatch.projectedScore,
        recentBalls,
        currentInnings: normalizedCurrentInnings,
        innings: allInnings,
        commentary: normalizedCommentary,
        sources: combinedSources,
        sourceUrl: combinedSources[0]?.url || baseMatch.sourceUrl,
      };

      // Save to detailed memory cache
      matchDetailsCache.set(matchId, { data: detailedMatch, timestamp: now });
      // Persist to disk
      saveScorecardsCacheToDisk(matchDetailsCache);

      // Update cachedMatches entry so match list stays up to date
      const cachedIdx = cachedMatches.findIndex((m) => m.id === baseMatch.id);
      if (cachedIdx !== -1) {
        cachedMatches[cachedIdx] = {
          ...cachedMatches[cachedIdx],
          status: detailedMatch.status,
          statusText: detailedMatch.statusText,
          result: detailedMatch.result,
          teamA: detailedMatch.teamA,
          teamB: detailedMatch.teamB,
          homeTeam: detailedMatch.homeTeam,
          awayTeam: detailedMatch.awayTeam,
          crr: detailedMatch.crr,
          rrr: detailedMatch.rrr,
          target: detailedMatch.target,
        };
      }

      return {
        source: 'gemini_grounded_web',
        match: detailedMatch,
        cached: false,
        statusCode: 200,
      };
    } catch (err: any) {
      console.error(`[CricketAPI] Error fetching detailed match ${matchId}:`, err?.message || err);
      const isRateLimit = isQuotaOrRateLimitError(err);
      if (isRateLimit) {
        rateLimitCooldownUntil = Date.now() + 60000;
      }

      if (cachedDetail) {
        return {
          source: 'gemini_grounded_cache',
          match: cachedDetail.data,
          cached: true,
          statusCode: 200,
        };
      }

      return {
        source: isRateLimit ? 'gemini_rate_limited' : 'gemini_error',
        match: baseMatch,
        cached: false,
        error: isRateLimit ? 'Rate limit active' : err?.message,
        statusCode: isRateLimit ? 429 : 500,
      };
    } finally {
      inFlightMatchDetailsPromises.delete(matchId);
    }
  })();

  inFlightMatchDetailsPromises.set(matchId, detailPromise);
  return detailPromise;
}

export async function getGroundedMatchScorecard(
  matchId: string,
  forceRefresh: boolean = false
): Promise<GroundedMatchDetailResponse> {
  return getGroundedMatchDetails(matchId, forceRefresh);
}

// ==========================================
// NEWS DATA SERVICE (GEMINI + SEARCH GROUNDING)
// ==========================================

export async function getGroundedCricketNews(forceRefresh: boolean = false): Promise<GroundedNewsResponse> {
  const now = Date.now();
  const NEWS_CACHE_TTL_MS = 900000; // 15 minutes cache for news articles
  const isCooldownActive = now < rateLimitCooldownUntil;

  // Return cached news if fresh or in cooldown
  if ((!forceRefresh || isCooldownActive) && cachedNews.length > 0 && (now - lastNewsFetchTime < NEWS_CACHE_TTL_MS || isCooldownActive)) {
    console.log(`[NewsAPI] cache HIT: serving ${cachedNews.length} verified news articles (cooldownActive=${isCooldownActive}).`);
    return {
      source: isCooldownActive ? 'gemini_rate_limited_cached' : 'gemini_grounded_cache',
      count: cachedNews.length,
      articles: cachedNews,
      cached: true,
      statusCode: 200,
    };
  }

  if (isCooldownActive && cachedNews.length === 0) {
    const retrySecs = Math.max(1, Math.ceil((rateLimitCooldownUntil - now) / 1000));
    console.log(`[NewsAPI] cache MISS & Gemini cooldown ACTIVE: retry in ${retrySecs}s.`);
    return {
      source: 'gemini_rate_limited',
      count: 0,
      articles: [],
      cached: false,
      error: `Gemini API quota or rate limit currently active. Please retry in ${retrySecs}s.`,
      statusCode: 429,
      retryAfterSeconds: retrySecs,
    };
  }

  console.log(`[NewsAPI] cache MISS & Gemini cooldown EXPIRED/INACTIVE: requesting verified news via Gemini + Google Search Grounding...`);

  // Request deduplication for news
  if (inFlightNewsPromise) {
    console.log('[NewsAPI] Request deduplication: attaching to active in-flight news promise.');
    return inFlightNewsPromise;
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.error('GEMINI_API_KEY is not configured on the server.');
    return {
      source: 'unconfigured_key',
      count: cachedNews.length,
      articles: cachedNews,
      cached: false,
      error: 'GEMINI_API_KEY is not configured on the server.',
      statusCode: 500,
    };
  }

  inFlightNewsPromise = (async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const prompt = `Search Google for CURRENT real-time cricket news today (${todayStr}) and this week from authoritative sports journalism sources:
ESPNcricinfo, BBC Sport, ICC-cricket, Sky Sports, Cricbuzz, The Indian Express, The Guardian, Fox Cricket.

CRITICAL INSTRUCTIONS:
- Retrieve real, current headlines, breaking stories, team announcements, tournament updates, and post-match reports.
- DO NOT invent headlines or fake news.
- Attribute each article accurately to its source news organization.
- Categorize each article into one of: "Latest", "Tournaments", "Teams", "Players", "Matches", "Breaking News".

Return your response strictly as a JSON object inside a \`\`\`json code block with the following schema:
{
  "articles": [
    {
      "headline": "Real verified headline",
      "summary": "2-3 sentence informative summary with factual details",
      "source": "Name of news publisher (e.g. ESPNcricinfo, BBC Sport, ICC)",
      "sourceUrl": "Source article URL if available or null",
      "publishedTime": "Published date or relative time (e.g. '2 hours ago')",
      "category": "Latest" | "Tournaments" | "Teams" | "Players" | "Matches" | "Breaking News",
      "tags": ["Cricket", "Topic Tag"]
    }
  ]
}`;

      let lastError: any = null;
      let responseText: string | undefined;
      let groundingSources: GroundingSource[] = [];

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });

          responseText = response.text;

          const metadata = response.candidates?.[0]?.groundingMetadata;
          if (metadata?.groundingChunks && Array.isArray(metadata.groundingChunks)) {
            groundingSources = metadata.groundingChunks
              .map((chunk: any) => {
                const uri = chunk.web?.uri || chunk.web?.url;
                const title = chunk.web?.title || 'Cricket News Source';
                if (uri) return { title, url: uri };
                return null;
              })
              .filter(Boolean) as GroundingSource[];
          }

          if (responseText) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          if (isQuotaOrRateLimitError(err)) {
            const retrySecs = extractRetryDelaySeconds(err);
            rateLimitCooldownUntil = Date.now() + (retrySecs * 1000);
            console.warn(`[NewsAPI] Gemini cooldown ACTIVE (status 429) during news search. Retry in ${retrySecs}s.`);
            break;
          }
          console.warn(`[NewsAPI] Gemini news search with model ${modelName} failed, trying next candidate:`, err?.message || err);
        }
      }

      if (!responseText) {
        if (cachedNews.length > 0) {
          console.log(`[NewsAPI] cache HIT (fallback): serving ${cachedNews.length} verified news articles.`);
          return {
            source: 'gemini_grounded_cache',
            count: cachedNews.length,
            articles: cachedNews,
            cached: true,
            statusCode: 200,
          };
        }
        const isRateLimit = isQuotaOrRateLimitError(lastError);
        const retrySecs = isRateLimit ? extractRetryDelaySeconds(lastError) : 60;
        console.warn(`[NewsAPI] No news response text received. (isRateLimit=${isRateLimit}, retryIn=${retrySecs}s)`);
        return {
          source: isRateLimit ? 'gemini_rate_limited' : 'gemini_empty_fallback',
          count: 0,
          articles: [],
          cached: false,
          error: isRateLimit
            ? `Gemini API rate limit reached (429). Please retry in ${retrySecs}s.`
            : (lastError?.message || 'No response received from Gemini search grounding for news.'),
          statusCode: isRateLimit ? 429 : 502,
          retryAfterSeconds: isRateLimit ? retrySecs : undefined,
        };
      }

      const parsedData = extractJsonFromText(responseText);
      if (!parsedData || !Array.isArray(parsedData.articles)) {
        if (cachedNews.length > 0) {
          console.log(`[NewsAPI] cache HIT (parse fallback): serving ${cachedNews.length} verified news articles.`);
          return {
            source: 'gemini_grounded_cache',
            count: cachedNews.length,
            articles: cachedNews,
            cached: true,
            statusCode: 200,
          };
        }
        return {
          source: 'gemini_parse_fallback',
          count: 0,
          articles: [],
          cached: false,
          error: 'Gemini response could not be parsed into verified news structure.',
          statusCode: 502,
        };
      }

      const defaultImages = [
        'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1531415074868-036b1c57e359?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
      ];

      const validCategories = new Set(['Latest', 'For You', 'Teams', 'Players', 'Tournaments', 'Matches', 'Breaking News']);

      const normalizedArticles: NormalizedNewsArticle[] = parsedData.articles.map((item: any, idx: number) => {
        const summaryText = item.summary || item.headline || 'Read the full coverage and latest reporting.';
        const categoryVal = validCategories.has(item.category) ? item.category : 'Latest';

        // Match source URL from grounding chunks if possible
        const matchedChunk = groundingSources[idx % (groundingSources.length || 1)];
        const sourceUrl = item.sourceUrl || matchedChunk?.url;
        const sourceName = item.source || matchedChunk?.title || 'Cricket News Wire';

        return {
          id: `grounded-news-${idx}-${Date.now()}`,
          title: item.headline || 'Cricket News Update',
          summary: summaryText,
          source: sourceName,
          sourceUrl,
          publishedTime: item.publishedTime || undefined,
          category: categoryVal,
          timeAgo: formatRelativeTime(item.publishedTime),
          readTime: `${Math.max(2, Math.min(6, Math.ceil((summaryText.split(' ').length + 30) / 45)))} min read`,
          imageUrl: defaultImages[idx % defaultImages.length],
          tags: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags : ['Cricket', 'World Cricket'],
          url: sourceUrl,
        };
      });

      if (normalizedArticles.length > 0) {
        cachedNews = normalizedArticles;
        lastNewsFetchTime = now;
        saveNewsCacheToDisk(cachedNews, lastNewsFetchTime);
        console.log(`[NewsAPI] Gemini Search Grounding SUCCESS: ${normalizedArticles.length} verified news articles returned and cached.`);
      }

      return {
        source: 'gemini_grounded_web',
        count: normalizedArticles.length,
        articles: normalizedArticles,
        cached: false,
        statusCode: 200,
      };
    } catch (err: any) {
      console.error('[NewsAPI] Gemini search grounding error in getGroundedCricketNews:', err?.message || err);
      const isRateLimit = isQuotaOrRateLimitError(err);
      const retrySecs = isRateLimit ? extractRetryDelaySeconds(err) : 60;
      if (isRateLimit) {
        rateLimitCooldownUntil = Date.now() + (retrySecs * 1000);
        console.warn(`[NewsAPI] Gemini cooldown ACTIVE (status 429). Retry in ${retrySecs}s.`);
      }

      if (cachedNews.length > 0) {
        console.log(`[NewsAPI] cache HIT (stale on error): serving ${cachedNews.length} verified news articles.`);
        return {
          source: 'gemini_grounded_cache',
          count: cachedNews.length,
          articles: cachedNews,
          cached: true,
          error: isRateLimit ? 'Served cached news due to active rate limit.' : 'Served cached news due to search grounding error.',
          statusCode: 200,
        };
      }

      return {
        source: isRateLimit ? 'gemini_rate_limited' : 'gemini_error',
        count: 0,
        articles: [],
        cached: false,
        error: isRateLimit
          ? `Gemini API rate limit reached (429). Please retry in ${retrySecs}s.`
          : (err?.message || 'Failed to retrieve grounded cricket news.'),
        statusCode: isRateLimit ? 429 : 502,
        retryAfterSeconds: isRateLimit ? retrySecs : undefined,
      };
    } finally {
      inFlightNewsPromise = null;
    }
  })();

  return inFlightNewsPromise;
}

// ==========================================
// UTILITY: ROBUST JSON EXTRACTION
// ==========================================

function extractJsonFromText(rawText: string): any {
  if (!rawText) return null;

  // 1. Look for ```json ... ``` blocks
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/i;
  const match = rawText.match(codeBlockRegex);
  const targetStr = match ? match[1].trim() : rawText.trim();

  // 2. Try direct JSON.parse
  try {
    return JSON.parse(targetStr);
  } catch {
    // 3. Fallback: extract between outer braces
    const firstBrace = targetStr.indexOf('{');
    const lastBrace = targetStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sub = targetStr.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(sub);
      } catch {
        // Sanitize trailing commas
        const sanitized = sub.replace(/,\s*([}\]])/g, '$1');
        try {
          return JSON.parse(sanitized);
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

