import {
  MatchDetailApiResponse,
  MatchesApiResponse,
  NewsApiResponse,
  NormalizedMatch,
  NormalizedNewsArticle,
  ScorecardApiResponse,
} from '../types/cricket';
import { cricketCacheStore } from '../cache/cacheStore';
import { hasCompleteScorecard } from '../normalizers/matchNormalizer';
import { sportmonksProvider } from '../providers/sportmonksProvider';
import {
  deduplicateProviderMatches,
  secondaryProvidersRegistry,
} from '../providers/secondaryCricketProvider';
import { getConfiguredNewsProviders } from '../providers/newsProviders';

const MATCHES_CACHE_TTL_MS = 45_000; // 45s for fresh live & fixture updates
const LIVE_SCORECARD_TTL_MS = 30_000; // 30s for live scorecards
const COMPLETED_SCORECARD_TTL_MS = 24 * 60 * 60 * 1000; // 24h for finished matches
const NEWS_CACHE_TTL_MS = 5 * 60 * 1000; // 5m for RSS news aggregation

export async function getCricketSystemStatus(verifyUpstream: boolean = false) {
  const primaryConfigured = sportmonksProvider.isConfigured();
  const verification = primaryConfigured
    ? await sportmonksProvider.verifyConnection(verifyUpstream)
    : null;
  const secondaryConfigured = secondaryProvidersRegistry
    .filter((p) => p.isConfigured())
    .map((p) => ({ id: p.id, name: p.name, connected: true }));
  const newsProviders = getConfiguredNewsProviders().map((p) => ({
    id: p.id,
    name: p.name,
    enabled: p.isEnabled(),
  }));

  const cooldownRemaining = cricketCacheStore.getProviderCooldownRemainingSeconds(
    sportmonksProvider.id
  );

  const primaryVerified = Boolean(verification?.verified);

  return {
    status: primaryConfigured ? (primaryVerified ? 'ok' : 'degraded') : 'unconfigured',
    timestamp: new Date().toISOString(),
    matchesApi: {
      connected: primaryVerified || secondaryConfigured.length > 0,
      primaryConfigured,
      verified: primaryVerified,
      verificationStatusCode: verification?.statusCode,
      verificationError: verification?.error,
      checkedAt: verification?.checkedAt,
      leagues: verification?.leagues || [],
      provider: primaryConfigured
        ? sportmonksProvider.name
        : secondaryConfigured.length > 0
        ? secondaryConfigured[0].name
        : 'Sportmonks Cricket API v2.0 (Token Not Configured)',
      dataSource: primaryConfigured
        ? 'Sportmonks Official Cricket Data Feed'
        : 'Requires SPORTMONKS_API_TOKEN server environment variable',
      cooldownRemainingSeconds: cooldownRemaining,
      secondaryProviders: secondaryConfigured,
    },
    newsApi: {
      connected: newsProviders.some((p) => p.enabled),
      provider: newsProviders
        .filter((p) => p.enabled)
        .map((p) => p.name)
        .join(', '),
      dataSource: 'Permitted Sports Journalism RSS Feeds',
      providers: newsProviders,
    },
    cache: cricketCacheStore.getCacheStats(),
  };
}

export async function getCricketMatches(
  forceRefresh: boolean = false
): Promise<MatchesApiResponse> {
  if (!forceRefresh) {
    const freshCache = cricketCacheStore.getMatches(MATCHES_CACHE_TTL_MS);
    if (freshCache) {
      return {
        source: `${freshCache.provider}_cache`,
        providers: [freshCache.provider],
        cached: true,
        count: freshCache.data.length,
        matches: freshCache.data,
        statusCode: 200,
        code: 'OK',
      };
    }
  }

  return cricketCacheStore.deduplicate('matches:all', async () => {
    const staleCache = cricketCacheStore.getMatches();
    const activeProviders: string[] = [];

    // 1. Primary Provider: Sportmonks Cricket API
    const primaryRes = await sportmonksProvider.fetchMatches();
    let combinedMatches: NormalizedMatch[] = [];

    if (primaryRes.statusCode === 200 && primaryRes.matches.length > 0) {
      combinedMatches = primaryRes.matches;
      activeProviders.push(sportmonksProvider.id);
    }

    // 2. Optional Configured Secondary Providers (only when credentials are set and verified)
    for (const secondary of secondaryProvidersRegistry) {
      if (!secondary.isConfigured()) continue;
      const secRes = await secondary.fetchMatches();
      if (secRes.statusCode === 200 && secRes.matches.length > 0) {
        combinedMatches = deduplicateProviderMatches(combinedMatches, secRes.matches);
        activeProviders.push(secondary.id);
      }
    }

    if (combinedMatches.length > 0) {
      const providerLabel = activeProviders.join('+');
      cricketCacheStore.setMatches(combinedMatches, providerLabel);
      return {
        source: providerLabel,
        providers: activeProviders,
        cached: false,
        count: combinedMatches.length,
        matches: combinedMatches,
        statusCode: 200,
        code: 'OK',
      };
    }

    // Primary returned 200 with genuinely 0 fixtures in window
    if (primaryRes.statusCode === 200 && primaryRes.matches.length === 0 && activeProviders.length === 0) {
      return {
        source: sportmonksProvider.id,
        providers: [sportmonksProvider.id],
        cached: false,
        count: 0,
        matches: [],
        statusCode: 200,
        code: 'OK',
      };
    }

    // Fallback to stale verified cache ONLY if previous verified data exists
    if (staleCache && staleCache.data.length > 0) {
      return {
        source: `${staleCache.provider}_stale_cache`,
        providers: [staleCache.provider],
        cached: true,
        stale: true,
        count: staleCache.data.length,
        matches: staleCache.data,
        statusCode: 200,
        code: primaryRes.code,
        error: primaryRes.error,
        retryAfterSeconds: primaryRes.retryAfterSeconds,
      };
    }

    // Never fabricate matches when unconfigured or failing
    return {
      source: primaryRes.provider,
      providers: [],
      cached: false,
      count: 0,
      matches: [],
      statusCode: primaryRes.statusCode,
      code: primaryRes.code,
      error:
        primaryRes.error ||
        'Unable to retrieve cricket matches from configured providers.',
      retryAfterSeconds: primaryRes.retryAfterSeconds,
    };
  });
}

function resolveProviderForMatch(matchId: string) {
  for (const sec of secondaryProvidersRegistry) {
    if (sec.supportsMatchId(matchId)) {
      return sec;
    }
  }
  return sportmonksProvider;
}

export async function getCricketMatchDetails(
  matchId: string,
  forceRefresh: boolean = false
): Promise<MatchDetailApiResponse> {
  const provider = resolveProviderForMatch(matchId);
  const existingCached = cricketCacheStore.getScorecard(matchId);
  const baseFromList = cricketCacheStore.findMatchInList(matchId);

  const isCompleted =
    existingCached?.data?.status === 'RECENT' ||
    baseFromList?.status === 'RECENT';
  const ttlMs = isCompleted ? COMPLETED_SCORECARD_TTL_MS : LIVE_SCORECARD_TTL_MS;

  if (!forceRefresh && existingCached && hasCompleteScorecard(existingCached.data)) {
    if (Date.now() - existingCached.timestamp < ttlMs || isCompleted) {
      return {
        source: `${existingCached.provider}_cache`,
        match: existingCached.data,
        cached: true,
        statusCode: 200,
        code: 'OK',
      };
    }
  }

  return cricketCacheStore.deduplicate(`detail:${matchId}`, async () => {
    if (!provider.isConfigured()) {
      if (existingCached?.data) {
        return {
          source: `${existingCached.provider}_stale_cache`,
          match: existingCached.data,
          cached: true,
          stale: true,
          statusCode: 200,
          code: 'PROVIDER_NOT_CONFIGURED',
          error: `${provider.name} is not configured.`,
        };
      }
      return {
        source: provider.id,
        match: null,
        cached: false,
        statusCode: 503,
        code: 'PROVIDER_NOT_CONFIGURED',
        error: `${provider.name} requires server API credentials.`,
      };
    }

    const res = await provider.fetchMatchDetails(matchId);

    if (res.statusCode === 200 && res.match) {
      // Never overwrite an already verified complete scorecard with an incomplete fixture payload
      if (existingCached && hasCompleteScorecard(existingCached.data) && !hasCompleteScorecard(res.match)) {
        return {
          source: `${existingCached.provider}_cache`,
          match: existingCached.data,
          cached: true,
          stale: true,
          statusCode: 200,
          code: 'OK',
        };
      }

      if (hasCompleteScorecard(res.match) || res.match.status !== 'UPCOMING') {
        cricketCacheStore.setScorecard(matchId, res.match, provider.id);
      }

      return {
        source: provider.id,
        match: res.match,
        cached: false,
        statusCode: 200,
        code: 'OK',
      };
    }

    // Serve stale verified scorecard cache if upstream temporarily failed or rate-limited
    if (existingCached?.data) {
      return {
        source: `${existingCached.provider}_stale_cache`,
        match: existingCached.data,
        cached: true,
        stale: true,
        statusCode: 200,
        code: res.code,
        error: res.error,
        retryAfterSeconds: res.retryAfterSeconds,
      };
    }

    if (baseFromList && res.statusCode === 429) {
      return {
        source: `${provider.id}_rate_limited`,
        match: baseFromList,
        cached: true,
        stale: true,
        statusCode: 429,
        code: 'RATE_LIMITED',
        error: res.error,
        retryAfterSeconds: res.retryAfterSeconds,
      };
    }

    return {
      source: provider.id,
      match: null,
      cached: false,
      statusCode: res.statusCode,
      code: res.code,
      error: res.error || 'Match details unavailable.',
      retryAfterSeconds: res.retryAfterSeconds,
    };
  });
}

export async function getCricketMatchScorecard(
  matchId: string,
  forceRefresh: boolean = false
): Promise<ScorecardApiResponse> {
  const detail = await getCricketMatchDetails(matchId, forceRefresh);

  if (!detail.match) {
    return {
      source: detail.source,
      matchId,
      scorecardAvailable: false,
      partial: false,
      ballByBallAvailable: false,
      status: 'UNKNOWN',
      cached: detail.cached,
      stale: detail.stale,
      statusCode: detail.statusCode >= 400 ? detail.statusCode : 404,
      code: detail.code,
      error: detail.error || 'Scorecard not available for this match.',
      retryAfterSeconds: detail.retryAfterSeconds,
      innings: [],
      currentInnings: null,
      commentary: [],
      recentBalls: [],
      match: null,
    };
  }

  const m = detail.match;
  const hasStats = hasCompleteScorecard(m);

  // Never return HTTP 200 with an empty skeleton as though it were a complete scorecard
  if (!hasStats) {
    const statusCode = m.status === 'UPCOMING' ? 404 : 422;
    const msg =
      m.status === 'UPCOMING'
        ? 'Match has not started yet; scorecard is not yet available.'
        : 'Detailed batting and bowling scorecard data is not yet available from the data provider.';

    return {
      source: detail.source,
      matchId: m.id,
      scorecardAvailable: false,
      partial: false,
      ballByBallAvailable: Boolean(m.ballByBallSupported),
      status: m.status,
      cached: detail.cached,
      stale: detail.stale,
      statusCode,
      code: 'SCORECARD_UNAVAILABLE',
      error: msg,
      innings: [],
      currentInnings: null,
      commentary: m.commentary || [],
      recentBalls: m.recentBalls || [],
      toss: m.toss,
      result: m.result,
      playerOfMatch: m.playerOfMatch,
      venue: m.venue,
      matchSummary: m.matchSummary,
      match: m,
    };
  }

  const inningsList = m.innings && m.innings.length > 0 ? m.innings : [m.currentInnings];
  const isPartial = inningsList.some(
    (inn) => inn.batters.length === 0 || inn.bowlers.length === 0
  );

  return {
    source: detail.source,
    matchId: m.id,
    scorecardAvailable: true,
    partial: isPartial,
    ballByBallAvailable: Boolean(m.ballByBallSupported || (m.commentary && m.commentary.length > 0)),
    status: m.status,
    cached: detail.cached,
    stale: detail.stale,
    statusCode: 200,
    code: 'OK',
    innings: inningsList,
    currentInnings: m.currentInnings,
    commentary: m.commentary || [],
    recentBalls: m.recentBalls || [],
    toss: m.toss,
    result: m.result,
    playerOfMatch: m.playerOfMatch,
    venue: m.venue,
    matchSummary: m.matchSummary,
    match: m,
  };
}

export async function getCricketNews(
  forceRefresh: boolean = false
): Promise<NewsApiResponse> {
  if (!forceRefresh) {
    const freshNews = cricketCacheStore.getNews(NEWS_CACHE_TTL_MS);
    if (freshNews) {
      return {
        source: `${freshNews.provider}_cache`,
        providers: freshNews.provider.split('+'),
        cached: true,
        count: freshNews.data.length,
        articles: freshNews.data,
        statusCode: 200,
      };
    }
  }

  return cricketCacheStore.deduplicate('news:all', async () => {
    const staleNews = cricketCacheStore.getNews();
    const providers = getConfiguredNewsProviders().filter((p) => p.isEnabled());

    const results = await Promise.all(providers.map((p) => p.fetchArticles()));

    const allArticles: NormalizedNewsArticle[] = [];
    const succeededProviders: string[] = [];
    const failedProviders: { provider: string; error: string }[] = [];

    for (const r of results) {
      if (r.articles.length > 0) {
        succeededProviders.push(r.provider);
        allArticles.push(...r.articles);
      } else if (r.error) {
        failedProviders.push({ provider: r.provider, error: r.error });
      }
    }

    // Deduplicate by URL and normalized title
    const seenKeys = new Set<string>();
    const uniqueArticles: NormalizedNewsArticle[] = [];
    for (const art of allArticles) {
      const urlKey = art.url.toLowerCase();
      const titleKey = art.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
      if (seenKeys.has(urlKey) || seenKeys.has(titleKey)) continue;
      seenKeys.add(urlKey);
      seenKeys.add(titleKey);
      uniqueArticles.push(art);
    }

    // Sort newest first by publishedTime
    uniqueArticles.sort((a, b) => {
      const tA = a.publishedTime ? new Date(a.publishedTime).getTime() : 0;
      const tB = b.publishedTime ? new Date(b.publishedTime).getTime() : 0;
      return tB - tA;
    });

    const trimmed = uniqueArticles.slice(0, 36);

    if (trimmed.length > 0) {
      const providerStr = succeededProviders.join('+');
      cricketCacheStore.setNews(trimmed, providerStr);
      return {
        source: providerStr,
        providers: succeededProviders,
        cached: false,
        count: trimmed.length,
        articles: trimmed,
        statusCode: 200,
        failedProviders: failedProviders.length > 0 ? failedProviders : undefined,
      };
    }

    if (staleNews && staleNews.data.length > 0) {
      return {
        source: `${staleNews.provider}_stale_cache`,
        providers: staleNews.provider.split('+'),
        cached: true,
        stale: true,
        count: staleNews.data.length,
        articles: staleNews.data,
        statusCode: 200,
        failedProviders,
      };
    }

    return {
      source: 'rss_unavailable',
      providers: [],
      cached: false,
      count: 0,
      articles: [],
      statusCode: 503,
      error: 'Unable to retrieve cricket news from external RSS feeds right now.',
      failedProviders,
    };
  });
}

export async function getCricketMatchSummary(matchId: string) {
  const detail = await getCricketMatchDetails(matchId, false);
  const match = detail.match;
  if (!match) {
    return {
      statusCode: detail.statusCode >= 400 ? detail.statusCode : 404,
      error: detail.error || 'Match not found',
    };
  }

  // Strictly compute top performers from verified scorecard figures (zero fabrication)
  const inningsList = match.innings && match.innings.length > 0 ? match.innings : [match.currentInnings];
  const topBatters = inningsList
    .flatMap((inn) => inn.batters || [])
    .filter((b) => typeof b.runs === 'number')
    .sort((a, b) => Number(b.runs) - Number(a.runs))
    .slice(0, 2)
    .map((b) => `${b.name}: ${b.runs} (${b.balls})`);

  const topBowlers = inningsList
    .flatMap((inn) => inn.bowlers || [])
    .filter((bw) => typeof bw.wickets === 'number')
    .sort((a, b) => Number(b.wickets) - Number(a.wickets))
    .slice(0, 2)
    .map((bw) => `${bw.name}: ${bw.wickets}/${bw.runs} (${bw.overs} ov)`);

  return {
    statusCode: 200,
    matchId: match.id,
    title: match.title,
    tournament: match.tournament,
    status: match.status,
    statusText: match.statusText,
    summary:
      match.matchSummary ||
      `${match.teamA.name} (${match.teamA.score}) vs ${match.teamB.name} (${match.teamB.score || 'TBA'}) at ${match.venue}. ${match.statusText}.`,
    topPerformers: [...topBatters, ...topBowlers],
    turningPoints: match.statusText ? [match.statusText] : [],
    venue: match.venue,
    sources: match.sources,
  };
}
