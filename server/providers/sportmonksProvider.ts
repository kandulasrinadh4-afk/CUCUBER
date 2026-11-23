import {
  CricketMatchProvider,
  NormalizedMatch,
  ProviderFetchMatchDetailResult,
  ProviderFetchMatchesResult,
} from '../types/cricket';
import { normalizeSportmonksFixture } from '../normalizers/matchNormalizer';
import { cricketCacheStore } from '../cache/cacheStore';

const SPORTMONKS_BASE_URL = 'https://cricket.sportmonks.com/api/v2.0';
const REQUEST_TIMEOUT_MS = 12000;

function redactSecrets(text: string): string {
  return (text || '').replace(/api_token=[^&\s]+/gi, 'api_token=[REDACTED]');
}

function getSportmonksToken(): string {
  const token = (process.env.SPORTMONKS_API_TOKEN || '').trim();
  cricketCacheStore.syncSportmonksTokenFingerprint(token);
  return token;
}

function formatDateYMD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

class SportmonksHttpError extends Error {
  status: number;
  retryAfterSeconds?: number;
  constructor(status: number, message: string, retryAfterSeconds?: number) {
    super(redactSecrets(message));
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function sportmonksGet<T = any>(
  endpointPath: string,
  params: Record<string, string>,
  retries: number = 2
): Promise<T> {
  const token = getSportmonksToken();
  if (!token) {
    throw new SportmonksHttpError(503, 'SPORTMONKS_API_TOKEN is not configured on the server.');
  }

  const url = new URL(`${SPORTMONKS_BASE_URL}${endpointPath}`);
  url.searchParams.set('api_token', token);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Cucuber-Cricket-Backend/2.0',
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      const bodyText = await response.text();
      let json: any = null;
      try {
        json = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        json = null;
      }

      if (response.status === 429) {
        const headerRetry = parseInt(response.headers.get('Retry-After') || '', 10);
        const resetSec = json?.rate_limit?.resets_in_seconds || headerRetry || 60;
        const safeRetry = isNaN(Number(resetSec)) || Number(resetSec) <= 0 ? 60 : Number(resetSec);
        cricketCacheStore.setProviderCooldown('sportmonks', safeRetry);
        throw new SportmonksHttpError(429, 'Sportmonks API rate limit exceeded.', safeRetry);
      }

      if (response.status === 401) {
        throw new SportmonksHttpError(401, 'Sportmonks API token is invalid or unauthorized.');
      }

      if (response.status === 403) {
        const msg = json?.message?.message || json?.message || 'Endpoint or include not permitted by current Sportmonks subscription plan.';
        throw new SportmonksHttpError(403, String(msg));
      }

      if (!response.ok) {
        const msg = json?.message?.message || json?.message || `Sportmonks HTTP ${response.status}`;
        if (response.status >= 500 && attempt < retries) {
          await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
          continue;
        }
        throw new SportmonksHttpError(response.status, String(msg));
      }

      cricketCacheStore.clearProviderCooldown('sportmonks');
      return json as T;
    } catch (err: any) {
      lastErr = err;
      if (err instanceof SportmonksHttpError) {
        throw err;
      }
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
        continue;
      }
    }
  }

  throw new SportmonksHttpError(
    502,
    redactSecrets((lastErr as Error)?.message || 'Unable to reach Sportmonks Cricket API.')
  );
}

export class SportmonksCricketProvider implements CricketMatchProvider {
  readonly id = 'sportmonks';
  readonly name = 'Sportmonks Cricket API v2.0';
  readonly isPrimary = true;

  isConfigured(): boolean {
    return getSportmonksToken().length > 0;
  }

  supportsMatchId(matchId: string): boolean {
    const clean = (matchId || '').trim();
    return clean.startsWith('sm-') || /^\d+$/.test(clean);
  }

  extractProviderMatchId(matchId: string): string {
    const clean = (matchId || '').trim();
    return clean.startsWith('sm-') ? clean.slice(3) : clean;
  }

  private verificationCache: {
    timestamp: number;
    result: {
      verified: boolean;
      statusCode: number;
      leagues: { id: number; name: string; type?: string }[];
      error?: string;
      checkedAt: string;
    };
  } | null = null;

  async verifyConnection(force: boolean = false): Promise<{
    verified: boolean;
    statusCode: number;
    leagues: { id: number; name: string; type?: string }[];
    error?: string;
    checkedAt: string;
  }> {
    if (!this.isConfigured()) {
      return {
        verified: false,
        statusCode: 503,
        leagues: [],
        error: 'SPORTMONKS_API_TOKEN is not configured on the server.',
        checkedAt: new Date().toISOString(),
      };
    }

    if (!force && this.verificationCache && Date.now() - this.verificationCache.timestamp < 5 * 60 * 1000) {
      return this.verificationCache.result;
    }

    const cooldownSecs = cricketCacheStore.getProviderCooldownRemainingSeconds(this.id);
    if (cooldownSecs > 0) {
      return {
        verified: false,
        statusCode: 429,
        leagues: this.verificationCache?.result.leagues || [],
        error: `Sportmonks rate-limit cooldown active (${cooldownSecs}s remaining).`,
        checkedAt: new Date().toISOString(),
      };
    }

    try {
      const payload = await sportmonksGet<any>('/leagues', {});
      const leagues: { id: number; name: string; type?: string }[] = Array.isArray(payload?.data)
        ? payload.data.map((l: any) => ({
            id: Number(l?.id || 0),
            name: String(l?.name || 'League').trim(),
            type: l?.type ? String(l.type) : undefined,
          }))
        : [];
      const result: {
        verified: boolean;
        statusCode: number;
        leagues: { id: number; name: string; type?: string }[];
        error?: string;
        checkedAt: string;
      } = {
        verified: true,
        statusCode: 200,
        leagues,
        checkedAt: new Date().toISOString(),
      };
      this.verificationCache = { timestamp: Date.now(), result };
      return result;
    } catch (err: any) {
      const statusCode = err instanceof SportmonksHttpError ? err.status : 502;
      const result = {
        verified: false,
        statusCode,
        leagues: [] as { id: number; name: string; type?: string }[],
        error: redactSecrets(err?.message || 'Unable to verify Sportmonks token.'),
        checkedAt: new Date().toISOString(),
      };
      if (statusCode === 401 || statusCode === 403) {
        this.verificationCache = { timestamp: Date.now(), result };
      }
      return result;
    }
  }

  async fetchMatches(): Promise<ProviderFetchMatchesResult> {
    if (!this.isConfigured()) {
      return {
        matches: [],
        provider: this.id,
        statusCode: 503,
        code: 'PROVIDER_NOT_CONFIGURED',
        error: 'SPORTMONKS_API_TOKEN is not configured on the server.',
      };
    }

    const cooldownSecs = cricketCacheStore.getProviderCooldownRemainingSeconds(this.id);
    if (cooldownSecs > 0) {
      return {
        matches: [],
        provider: this.id,
        statusCode: 429,
        code: 'RATE_LIMITED',
        error: `Sportmonks API rate-limit cooldown active. Retry in ${cooldownSecs}s.`,
        retryAfterSeconds: cooldownSecs,
      };
    }

    const baseIncludes = 'localteam,visitorteam,runs,scoreboards,league,stage,venue';
    const detailIncludes = `${baseIncludes},tosswon,winnerteam,manofmatch`;

    const now = new Date();
    const startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
    const startsBetween = `${formatDateYMD(startDate)},${formatDateYMD(endDate)}`;

    try {
      const fetchLivescoresSafe = async () => {
        try {
          return await sportmonksGet('/livescores', { include: detailIncludes });
        } catch (err: any) {
          if (err instanceof SportmonksHttpError && (err.status === 403 || err.status === 400)) {
            return await sportmonksGet('/livescores', { include: baseIncludes });
          }
          throw err;
        }
      };

      const [livescoresRes, fixturesPage1Res] = await Promise.allSettled([
        fetchLivescoresSafe(),
        sportmonksGet('/fixtures', {
          include: detailIncludes,
          'filter[starts_between]': startsBetween,
          sort: '-starting_at',
          page: '1',
        }),
      ]);

      // Check for hard auth/rate-limit errors first
      for (const settled of [livescoresRes, fixturesPage1Res]) {
        if (settled.status === 'rejected' && settled.reason instanceof SportmonksHttpError) {
          const e = settled.reason;
          if (e.status === 429 || e.status === 401) {
            return {
              matches: [],
              provider: this.id,
              statusCode: e.status,
              code: e.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_ERROR',
              error: e.message,
              retryAfterSeconds: e.retryAfterSeconds,
            };
          }
        }
      }

      const rawMap = new Map<string, any>();

      if (fixturesPage1Res.status === 'fulfilled') {
        const page1Payload = fixturesPage1Res.value;
        if (Array.isArray(page1Payload?.data)) {
          for (const f of page1Payload.data) {
            if (f?.id) rawMap.set(String(f.id), f);
          }
        }

        // Inspect Sportmonks v2.0 pagination metadata and fetch remaining pages safely
        const pagination = page1Payload?.meta?.pagination;
        const currentPage = Number(pagination?.current_page || 1);
        const totalPages = Number(pagination?.total_pages || 1);
        const hasNextLink = Boolean(pagination?.links?.next || page1Payload?.links?.next);
        const MAX_FIXTURE_PAGES = 5;

        if ((totalPages > currentPage || hasNextLink) && currentPage < MAX_FIXTURE_PAGES) {
          const lastPageToFetch = totalPages > currentPage ? Math.min(totalPages, MAX_FIXTURE_PAGES) : MAX_FIXTURE_PAGES;
          for (let pageNum = currentPage + 1; pageNum <= lastPageToFetch; pageNum++) {
            if (cricketCacheStore.getProviderCooldownRemainingSeconds(this.id) > 0) {
              break;
            }
            try {
              const nextPayload = await sportmonksGet('/fixtures', {
                include: detailIncludes,
                'filter[starts_between]': startsBetween,
                sort: '-starting_at',
                page: String(pageNum),
              });
              const pageItems = Array.isArray(nextPayload?.data) ? nextPayload.data : [];
              if (pageItems.length === 0) break;

              for (const f of pageItems) {
                if (f?.id) rawMap.set(String(f.id), f);
              }

              const nextMeta = nextPayload?.meta?.pagination;
              const nextCur = Number(nextMeta?.current_page || pageNum);
              const nextTot = Number(nextMeta?.total_pages || pageNum);
              const nextHasLink = Boolean(nextMeta?.links?.next || nextPayload?.links?.next);
              if (nextCur >= nextTot && !nextHasLink) {
                break;
              }
            } catch (pageErr: any) {
              // Stop paging gracefully on rate-limit/plan error without discarding already-fetched fixtures
              if (pageErr instanceof SportmonksHttpError && (pageErr.status === 429 || pageErr.status === 401 || pageErr.status === 403)) {
                break;
              }
              break;
            }
          }
        }
      }

      // Live scores override fixture summaries for active matches
      if (livescoresRes.status === 'fulfilled' && Array.isArray(livescoresRes.value?.data)) {
        for (const f of livescoresRes.value.data) {
          if (f?.id) rawMap.set(String(f.id), f);
        }
      }

      // If fixtures returned 403/plan limit without livescores, surface meaningful status
      if (
        rawMap.size === 0 &&
        livescoresRes.status === 'rejected' &&
        fixturesPage1Res.status === 'rejected'
      ) {
        const err = fixturesPage1Res.reason;
        const status = err instanceof SportmonksHttpError ? err.status : 502;
        return {
          matches: [],
          provider: this.id,
          statusCode: status,
          code: status === 403 ? 'PLAN_LIMITED' : 'UPSTREAM_ERROR',
          error: redactSecrets(err?.message || 'Failed to retrieve Sportmonks fixtures.'),
        };
      }

      const normalized: NormalizedMatch[] = Array.from(rawMap.values()).map(normalizeSportmonksFixture);

      // Sort: LIVE/INTERRUPTED first, then UPCOMING soonest, then RECENT newest
      const statusWeight: Record<string, number> = {
        LIVE: 0,
        INTERRUPTED: 1,
        UPCOMING: 2,
        RECENT: 3,
      };
      normalized.sort((a, b) => {
        const wDiff = (statusWeight[a.status] ?? 9) - (statusWeight[b.status] ?? 9);
        if (wDiff !== 0) return wDiff;
        const tA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const tB = b.startTime ? new Date(b.startTime).getTime() : 0;
        if (a.status === 'UPCOMING') return tA - tB;
        return tB - tA;
      });

      return {
        matches: normalized,
        provider: this.id,
        statusCode: 200,
        code: 'OK',
      };
    } catch (err: any) {
      const status = err instanceof SportmonksHttpError ? err.status : 502;
      return {
        matches: [],
        provider: this.id,
        statusCode: status,
        code: status === 429 ? 'RATE_LIMITED' : status === 403 ? 'PLAN_LIMITED' : 'UPSTREAM_ERROR',
        error: redactSecrets(err?.message || 'Sportmonks request failed.'),
        retryAfterSeconds: err?.retryAfterSeconds,
      };
    }
  }

  async fetchMatchDetails(matchId: string): Promise<ProviderFetchMatchDetailResult> {
    if (!this.isConfigured()) {
      return {
        match: null,
        provider: this.id,
        statusCode: 503,
        code: 'PROVIDER_NOT_CONFIGURED',
        error: 'SPORTMONKS_API_TOKEN is not configured on the server.',
      };
    }

    const cooldownSecs = cricketCacheStore.getProviderCooldownRemainingSeconds(this.id);
    if (cooldownSecs > 0) {
      return {
        match: null,
        provider: this.id,
        statusCode: 429,
        code: 'RATE_LIMITED',
        error: `Sportmonks API rate-limit cooldown active. Retry in ${cooldownSecs}s.`,
        retryAfterSeconds: cooldownSecs,
      };
    }

    const smId = this.extractProviderMatchId(matchId);
    if (!/^\d+$/.test(smId)) {
      return {
        match: null,
        provider: this.id,
        statusCode: 404,
        code: 'NOT_FOUND',
        error: `Invalid Sportmonks fixture ID: ${matchId}`,
      };
    }

    const coreIncludes = [
      'localteam',
      'visitorteam',
      'runs',
      'scoreboards',
      'batting.batsman',
      'batting.result',
      'batting.bowler',
      'batting.catchstump',
      'batting.runoutby',
      'bowling.bowler',
      'league',
      'stage',
      'venue',
      'manofmatch',
      'tosswon',
      'winnerteam',
      'firstumpire',
      'secondumpire',
      'lineup',
    ].join(',');

    const fullIncludesWithBalls = `${coreIncludes},balls.batsman,balls.bowler,balls.score`;

    try {
      let payload: any;
      let ballByBallAvailable = true;

      try {
        payload = await sportmonksGet(`/fixtures/${smId}`, { include: fullIncludesWithBalls });
      } catch (err: any) {
        // Gracefully degrade if subscribed Sportmonks plan does not include `balls`
        if (err instanceof SportmonksHttpError && (err.status === 403 || err.status === 400)) {
          ballByBallAvailable = false;
          payload = await sportmonksGet(`/fixtures/${smId}`, { include: coreIncludes });
        } else {
          throw err;
        }
      }

      if (!payload?.data) {
        return {
          match: null,
          provider: this.id,
          statusCode: 404,
          code: 'NOT_FOUND',
          error: `Fixture ${smId} was not found on Sportmonks.`,
        };
      }

      const normalized = normalizeSportmonksFixture(payload.data);
      normalized.ballByBallSupported = ballByBallAvailable && Array.isArray(payload.data?.balls);

      return {
        match: normalized,
        provider: this.id,
        statusCode: 200,
        code: 'OK',
        ballByBallAvailable: normalized.ballByBallSupported,
      };
    } catch (err: any) {
      const status = err instanceof SportmonksHttpError ? err.status : 502;
      return {
        match: null,
        provider: this.id,
        statusCode: status,
        code:
          status === 404
            ? 'NOT_FOUND'
            : status === 429
            ? 'RATE_LIMITED'
            : status === 403
            ? 'PLAN_LIMITED'
            : 'UPSTREAM_ERROR',
        error: redactSecrets(err?.message || 'Failed to fetch Sportmonks fixture details.'),
        retryAfterSeconds: err?.retryAfterSeconds,
      };
    }
  }
}

export const sportmonksProvider = new SportmonksCricketProvider();
