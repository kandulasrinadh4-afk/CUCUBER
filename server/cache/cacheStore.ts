import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NormalizedMatch, NormalizedNewsArticle } from '../types/cricket';

const CACHE_DIR = path.resolve(process.cwd(), '.cache');
const MATCHES_CACHE_FILE = path.join(CACHE_DIR, 'cricket_matches_cache.json');
const SCORECARDS_CACHE_FILE = path.join(CACHE_DIR, 'cricket_scorecards_cache.json');
const NEWS_CACHE_FILE = path.join(CACHE_DIR, 'cricket_news_cache.json');
const META_CACHE_FILE = path.join(CACHE_DIR, 'cricket_meta.json');

export interface CacheEntry<T> {
  timestamp: number;
  provider: string;
  data: T;
}

function ensureCacheDir(): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[CacheStore] Could not create .cache directory:', (err as Error)?.message);
  }
}

function isLegacyGeminiRecord(record: any): boolean {
  if (!record || typeof record !== 'object') return false;
  const provider = String(record.provider || '').toLowerCase();
  if (provider.includes('gemini') || provider.includes('grounding')) {
    return true;
  }
  const serialized = JSON.stringify(record);
  if (serialized.includes('vertexaisearch.cloud.google.com')) {
    return true;
  }
  return false;
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trim()) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[CacheStore] Failed reading ${path.basename(filePath)}:`, (err as Error)?.message);
    return null;
  }
}

function writeJsonFile(filePath: string, payload: unknown): void {
  try {
    ensureCacheDir();
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[CacheStore] Failed writing ${path.basename(filePath)}:`, (err as Error)?.message);
  }
}

class CricketCacheStore {
  private matchesCache: CacheEntry<NormalizedMatch[]> | null = null;
  private scorecardCache = new Map<string, CacheEntry<NormalizedMatch>>();
  private newsCache: CacheEntry<NormalizedNewsArticle[]> | null = null;
  private inFlightRequests = new Map<string, Promise<unknown>>();
  private providerCooldowns = new Map<string, number>();
  private lastTokenFingerprint: string | null = null;

  constructor() {
    this.hydrateFromDisk();
  }

  private hydrateFromDisk(): void {
    const savedMeta = readJsonFile<{ sportmonksTokenHash?: string }>(META_CACHE_FILE);
    if (savedMeta?.sportmonksTokenHash) {
      this.lastTokenFingerprint = savedMeta.sportmonksTokenHash;
    }

    const savedMatches = readJsonFile<CacheEntry<NormalizedMatch[]>>(MATCHES_CACHE_FILE);
    if (savedMatches && Array.isArray(savedMatches.data) && savedMatches.data.length > 0 && !isLegacyGeminiRecord(savedMatches)) {
      this.matchesCache = savedMatches;
    }

    const savedScorecards = readJsonFile<Record<string, CacheEntry<NormalizedMatch>>>(SCORECARDS_CACHE_FILE);
    if (savedScorecards && typeof savedScorecards === 'object') {
      for (const [id, entry] of Object.entries(savedScorecards)) {
        if (entry && entry.data && !isLegacyGeminiRecord(entry)) {
          this.scorecardCache.set(id, entry);
        }
      }
    }

    const savedNews = readJsonFile<CacheEntry<NormalizedNewsArticle[]>>(NEWS_CACHE_FILE);
    if (savedNews && Array.isArray(savedNews.data) && savedNews.data.length > 0 && !isLegacyGeminiRecord(savedNews)) {
      this.newsCache = savedNews;
    }
  }

  /**
   * Checks a one-way SHA-256 hash of the active Sportmonks token (never stores raw secrets)
   * and clears stale match/scorecard caches whenever the token is updated.
   */
  syncSportmonksTokenFingerprint(rawToken: string): void {
    const clean = (rawToken || '').trim();
    const nextHash = clean
      ? crypto.createHash('sha256').update(clean).digest('hex').slice(0, 16)
      : 'unconfigured';

    if (this.lastTokenFingerprint !== null && this.lastTokenFingerprint !== nextHash) {
      this.clearCricketMatchCaches();
      this.clearProviderCooldown('sportmonks');
    }

    if (this.lastTokenFingerprint !== nextHash) {
      this.lastTokenFingerprint = nextHash;
      writeJsonFile(META_CACHE_FILE, {
        sportmonksTokenHash: nextHash,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  clearCricketMatchCaches(): void {
    this.matchesCache = null;
    this.scorecardCache.clear();
    try {
      if (fs.existsSync(MATCHES_CACHE_FILE)) fs.unlinkSync(MATCHES_CACHE_FILE);
      if (fs.existsSync(SCORECARDS_CACHE_FILE)) fs.unlinkSync(SCORECARDS_CACHE_FILE);
    } catch (err) {
      console.warn('[CacheStore] Could not clear match cache files:', (err as Error)?.message);
    }
  }

  // Request deduplication
  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlightRequests.get(key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const promise = fn().finally(() => {
      this.inFlightRequests.delete(key);
    });
    this.inFlightRequests.set(key, promise);
    return promise;
  }

  // Provider rate-limit cooldown tracking
  setProviderCooldown(providerId: string, retryAfterSeconds: number): void {
    const clamped = Math.max(5, Math.min(retryAfterSeconds || 60, 3600));
    this.providerCooldowns.set(providerId, Date.now() + clamped * 1000);
  }

  getProviderCooldownRemainingSeconds(providerId: string): number {
    const until = this.providerCooldowns.get(providerId) || 0;
    const diff = until - Date.now();
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
  }

  clearProviderCooldown(providerId: string): void {
    this.providerCooldowns.delete(providerId);
  }

  // Matches Cache
  getMatches(maxAgeMs?: number): CacheEntry<NormalizedMatch[]> | null {
    if (!this.matchesCache || !Array.isArray(this.matchesCache.data) || this.matchesCache.data.length === 0) {
      return null;
    }
    if (maxAgeMs !== undefined && Date.now() - this.matchesCache.timestamp > maxAgeMs) {
      return null;
    }
    return this.matchesCache;
  }

  setMatches(matches: NormalizedMatch[], provider: string): void {
    if (!Array.isArray(matches) || matches.length === 0) return;
    const entry: CacheEntry<NormalizedMatch[]> = {
      timestamp: Date.now(),
      provider,
      data: matches,
    };
    this.matchesCache = entry;
    writeJsonFile(MATCHES_CACHE_FILE, entry);
  }

  findMatchInList(matchId: string): NormalizedMatch | null {
    const matches = this.matchesCache?.data || [];
    const exact = matches.find((m) => m.id === matchId || m.providerMatchId === matchId);
    if (exact) return exact;
    const norm = (matchId || '').toLowerCase().trim();
    return (
      matches.find(
        (m) =>
          m.id.toLowerCase() === norm ||
          m.providerMatchId.toLowerCase() === norm
      ) || null
    );
  }

  // Scorecard / Match Detail Cache
  getScorecard(matchId: string, maxAgeMs?: number): CacheEntry<NormalizedMatch> | null {
    const entry = this.scorecardCache.get(matchId);
    if (!entry || !entry.data) return null;
    if (maxAgeMs !== undefined && Date.now() - entry.timestamp > maxAgeMs) {
      return null;
    }
    return entry;
  }

  setScorecard(matchId: string, match: NormalizedMatch, provider: string): void {
    if (!match) return;
    const entry: CacheEntry<NormalizedMatch> = {
      timestamp: Date.now(),
      provider,
      data: match,
    };
    this.scorecardCache.set(matchId, entry);
    if (match.id && match.id !== matchId) {
      this.scorecardCache.set(match.id, entry);
    }

    // Keep disk cache bounded to the 100 most recent scorecards
    if (this.scorecardCache.size > 100) {
      const oldestKey = this.scorecardCache.keys().next().value;
      if (oldestKey) {
        this.scorecardCache.delete(oldestKey);
      }
    }

    const obj: Record<string, CacheEntry<NormalizedMatch>> = {};
    for (const [k, v] of this.scorecardCache.entries()) {
      obj[k] = v;
    }
    writeJsonFile(SCORECARDS_CACHE_FILE, obj);
  }

  // News Cache
  getNews(maxAgeMs?: number): CacheEntry<NormalizedNewsArticle[]> | null {
    if (!this.newsCache || !Array.isArray(this.newsCache.data) || this.newsCache.data.length === 0) {
      return null;
    }
    if (maxAgeMs !== undefined && Date.now() - this.newsCache.timestamp > maxAgeMs) {
      return null;
    }
    return this.newsCache;
  }

  setNews(articles: NormalizedNewsArticle[], provider: string): void {
    if (!Array.isArray(articles) || articles.length === 0) return;
    const entry: CacheEntry<NormalizedNewsArticle[]> = {
      timestamp: Date.now(),
      provider,
      data: articles,
    };
    this.newsCache = entry;
    writeJsonFile(NEWS_CACHE_FILE, entry);
  }

  getCacheStats() {
    return {
      matchesCount: this.matchesCache?.data.length || 0,
      matchesUpdatedAt: this.matchesCache ? new Date(this.matchesCache.timestamp).toISOString() : null,
      scorecardsCount: this.scorecardCache.size,
      newsCount: this.newsCache?.data.length || 0,
      newsUpdatedAt: this.newsCache ? new Date(this.newsCache.timestamp).toISOString() : null,
    };
  }
}

export const cricketCacheStore = new CricketCacheStore();
