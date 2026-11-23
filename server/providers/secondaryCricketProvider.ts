import {
  CricketMatchProvider,
  MatchStatusType,
  NormalizedInnings,
  NormalizedMatch,
  ProviderFetchMatchDetailResult,
  ProviderFetchMatchesResult,
} from '../types/cricket';
import {
  deriveShortName,
  resolveSafeLogo,
  sanitizeHttpUrl,
} from '../normalizers/matchNormalizer';
import { cricketCacheStore } from '../cache/cacheStore';

const CRICKETDATA_BASE_URL = 'https://api.cricapi.com/v1';
const REQUEST_TIMEOUT_MS = 10000;

function redactKey(text: string): string {
  return (text || '').replace(/apikey=[^&\s]+/gi, 'apikey=[REDACTED]');
}

function getCricketDataKey(): string {
  return (process.env.CRICKETDATA_API_KEY || '').trim();
}

function mapCricApiStatus(raw: any): MatchStatusType {
  if (raw?.matchEnded) return 'RECENT';
  const s = String(raw?.status || '').toLowerCase();
  if (s.includes('rain') || s.includes('delay') || s.includes('interrupt') || s.includes('abandon')) {
    return s.includes('abandon') || s.includes('no result') ? 'RECENT' : 'INTERRUPTED';
  }
  if (raw?.matchStarted) return 'LIVE';
  return 'UPCOMING';
}

function normalizeCricketDataMatch(raw: any, scorecardPayload?: any): NormalizedMatch {
  const providerId = String(raw?.id || '');
  const id = `cd-${providerId}`;
  const teams: string[] = Array.isArray(raw?.teams) ? raw.teams : [];
  const teamInfo: any[] = Array.isArray(raw?.teamInfo) ? raw.teamInfo : [];

  const homeName = String(teamInfo[0]?.name || teams[0] || 'Team A').trim();
  const awayName = String(teamInfo[1]?.name || teams[1] || 'Team B').trim();
  const homeShort = deriveShortName(homeName, teamInfo[0]?.shortname);
  const awayShort = deriveShortName(awayName, teamInfo[1]?.shortname);
  const homeLogo = resolveSafeLogo(teamInfo[0]?.img);
  const awayLogo = resolveSafeLogo(teamInfo[1]?.img);

  const scoreArr: any[] = Array.isArray(raw?.score) ? raw.score : [];
  const matchScoreForTeam = (teamName: string) => {
    const lower = teamName.toLowerCase();
    const hits = scoreArr.filter((s) => String(s?.inning || '').toLowerCase().includes(lower));
    if (hits.length === 0) return { score: null, wickets: null, overs: null };
    const latest = hits[hits.length - 1];
    const r = latest?.r ?? null;
    const w = latest?.w ?? null;
    const o = latest?.o ?? null;
    return {
      score: r !== null ? (w !== null && w < 10 ? `${r}/${w}` : `${r}`) : null,
      wickets: w !== null ? Number(w) : null,
      overs: o !== null ? String(o) : null,
    };
  };

  const homeSum = matchScoreForTeam(homeName);
  const awaySum = matchScoreForTeam(awayName);
  const status = mapCricApiStatus(raw);

  // Normalize optional CricketData match_scorecard payload if available
  const scInningsArr: any[] = Array.isArray(scorecardPayload?.scorecard) ? scorecardPayload.scorecard : [];
  const innings: NormalizedInnings[] = scInningsArr.map((inn, idx) => {
    const scRow = scoreArr[idx] || {};
    const batting: any[] = Array.isArray(inn?.batting) ? inn.batting : [];
    const bowling: any[] = Array.isArray(inn?.bowling) ? inn.bowling : [];
    const inningLabel = String(inn?.inning || scRow?.inning || `Innings ${idx + 1}`);
    const isHome = inningLabel.toLowerCase().includes(homeName.toLowerCase());
    const teamName = isHome ? homeName : inningLabel.toLowerCase().includes(awayName.toLowerCase()) ? awayName : inningLabel;
    const teamShort = isHome ? homeShort : inningLabel.toLowerCase().includes(awayName.toLowerCase()) ? awayShort : deriveShortName(teamName);

    const runs = scRow?.r !== undefined && scRow?.r !== null ? Number(scRow.r) : null;
    const wickets = scRow?.w !== undefined && scRow?.w !== null ? Number(scRow.w) : null;
    const oversStr = scRow?.o !== undefined && scRow?.o !== null ? String(scRow.o) : '0.0';
    const scoreStr = runs !== null ? (wickets !== null && wickets < 10 ? `${runs}/${wickets}` : `${runs}`) : '—';

    return {
      inningsNumber: idx + 1,
      teamName,
      teamShort,
      score: scoreStr,
      runs,
      wickets,
      overs: oversStr,
      runRate: runs !== null && Number(oversStr) > 0 ? Number((runs / Number(oversStr)).toFixed(2)) : null,
      batters: batting.map((b) => ({
        name: String(b?.batsman?.name || 'Batter'),
        runs: b?.r ?? '—',
        balls: b?.b ?? '—',
        fours: b?.['4s'] ?? '—',
        sixes: b?.['6s'] ?? '—',
        sr: b?.sr ?? '—',
        isStriker: false,
        isNotOut: String(b?.['dismissal-text'] || b?.dismissal || '').toLowerCase().includes('not out'),
        dismissal: String(b?.['dismissal-text'] || b?.dismissal || '—'),
      })),
      bowlers: bowling.map((bw) => ({
        name: String(bw?.bowler?.name || 'Bowler'),
        overs: bw?.o ?? '—',
        maidens: bw?.m ?? '—',
        runs: bw?.r ?? '—',
        wickets: bw?.w ?? '—',
        economy: bw?.eco ?? '—',
        wides: bw?.wd ?? '—',
        noBalls: bw?.nb ?? '—',
        isBowling: false,
      })),
      fallOfWickets: [],
      partnerships: [],
      yetToBat: [],
      extras: inn?.extras
        ? {
            wides: inn.extras.w ?? null,
            noBalls: inn.extras.nb ?? null,
            byes: inn.extras.b ?? null,
            legByes: inn.extras.lb ?? null,
            penalty: inn.extras.p ?? null,
            total: inn.extras.r ?? null,
            details: null,
          }
        : undefined,
    };
  });

  const currentInnings: NormalizedInnings =
    innings.length > 0
      ? innings[innings.length - 1]
      : {
          inningsNumber: 1,
          teamName: homeName,
          teamShort: homeShort,
          score: homeSum.score || '0/0',
          runs: null,
          wickets: homeSum.wickets,
          overs: homeSum.overs || '0.0',
          runRate: null,
          batters: [],
          bowlers: [],
          fallOfWickets: [],
          partnerships: [],
          yetToBat: [],
        };

  return {
    id,
    matchId: id,
    provider: 'cricketdata',
    providerMatchId: providerId,
    tournament: String(raw?.series || raw?.name || 'Cricket Series'),
    title: String(raw?.name || `${homeName} vs ${awayName}`),
    matchType: raw?.matchType ? String(raw.matchType).toUpperCase() : undefined,
    date: raw?.date ? String(raw.date) : null,
    venue: String(raw?.venue || 'Venue TBA'),
    status,
    startTime: raw?.dateTimeGMT ? String(raw.dateTimeGMT) : null,
    homeTeam: {
      name: homeName,
      shortName: homeShort,
      score: homeSum.score,
      wickets: homeSum.wickets,
      overs: homeSum.overs,
      logo: homeLogo,
    },
    awayTeam: {
      name: awayName,
      shortName: awayShort,
      score: awaySum.score,
      wickets: awaySum.wickets,
      overs: awaySum.overs,
      logo: awayLogo,
    },
    target: null,
    requiredRuns: null,
    requiredBalls: null,
    runRate: currentInnings.runRate,
    result: status === 'RECENT' ? String(raw?.status || '') : null,
    winner: raw?.matchWinner ? String(raw.matchWinner) : null,
    tossWinner: raw?.tossWinner ? String(raw.tossWinner) : null,
    tossDecision: raw?.tossChoice ? String(raw.tossChoice) : null,
    statusText: String(raw?.status || status),
    sources: [{ title: 'CricketData API', url: 'https://cricketdata.org/' }],
    sourceUrl: sanitizeHttpUrl('https://cricketdata.org/'),
    ballByBallSupported: false,
    teamA: {
      name: homeName,
      shortName: homeShort,
      logo: homeLogo,
      score: homeSum.score || (status === 'UPCOMING' ? 'TBA' : 'Yet to bat'),
      overs: homeSum.overs || '',
    },
    teamB: {
      name: awayName,
      shortName: awayShort,
      logo: awayLogo,
      score: awaySum.score || (status === 'UPCOMING' ? 'TBA' : 'Yet to bat'),
      overs: awaySum.overs || '',
    },
    crr: currentInnings.runRate ?? undefined,
    recentBalls: [],
    currentInnings,
    commentary: [],
    innings: innings.length > 0 ? innings : undefined,
    lastUpdated: new Date().toISOString(),
    toss: raw?.tossWinner
      ? `${raw.tossWinner} won the toss${raw.tossChoice ? ` and elected to ${raw.tossChoice}` : ''}`
      : undefined,
  };
}

/**
 * Optional secondary cricket provider adapter (CricketData.org / CricAPI v1).
 * Never active unless CRICKETDATA_API_KEY is configured and data is verified (`status === 'success'`).
 */
export class CricketDataSecondaryProvider implements CricketMatchProvider {
  readonly id = 'cricketdata';
  readonly name = 'CricketData.org API v1 (Secondary)';
  readonly isPrimary = false;

  isConfigured(): boolean {
    return getCricketDataKey().length > 0;
  }

  supportsMatchId(matchId: string): boolean {
    return (matchId || '').trim().startsWith('cd-');
  }

  extractProviderMatchId(matchId: string): string {
    const clean = (matchId || '').trim();
    return clean.startsWith('cd-') ? clean.slice(3) : clean;
  }

  async fetchMatches(): Promise<ProviderFetchMatchesResult> {
    const apiKey = getCricketDataKey();
    if (!apiKey) {
      return {
        matches: [],
        provider: this.id,
        statusCode: 503,
        code: 'PROVIDER_NOT_CONFIGURED',
        error: 'CRICKETDATA_API_KEY is not configured.',
      };
    }

    const cooldown = cricketCacheStore.getProviderCooldownRemainingSeconds(this.id);
    if (cooldown > 0) {
      return {
        matches: [],
        provider: this.id,
        statusCode: 429,
        code: 'RATE_LIMITED',
        error: `CricketData cooldown active (${cooldown}s).`,
        retryAfterSeconds: cooldown,
      };
    }

    try {
      const url = `${CRICKETDATA_BASE_URL}/currentMatches?apikey=${encodeURIComponent(apiKey)}&offset=0`;
      const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      const data: any = await res.json().catch(() => null);

      if (res.status === 429) {
        cricketCacheStore.setProviderCooldown(this.id, 120);
        return {
          matches: [],
          provider: this.id,
          statusCode: 429,
          code: 'RATE_LIMITED',
          error: 'CricketData API rate limit reached.',
          retryAfterSeconds: 120,
        };
      }

      if (!res.ok || data?.status !== 'success' || !Array.isArray(data?.data)) {
        return {
          matches: [],
          provider: this.id,
          statusCode: res.ok ? 502 : res.status,
          code: 'UPSTREAM_ERROR',
          error: redactKey(data?.reason || data?.status || 'CricketData verification failed.'),
        };
      }

      return {
        matches: data.data.map((m: any) => normalizeCricketDataMatch(m)),
        provider: this.id,
        statusCode: 200,
        code: 'OK',
      };
    } catch (err: any) {
      return {
        matches: [],
        provider: this.id,
        statusCode: 502,
        code: 'UPSTREAM_ERROR',
        error: redactKey(err?.message || 'CricketData request error.'),
      };
    }
  }

  async fetchMatchDetails(matchId: string): Promise<ProviderFetchMatchDetailResult> {
    const apiKey = getCricketDataKey();
    if (!apiKey) {
      return {
        match: null,
        provider: this.id,
        statusCode: 503,
        code: 'PROVIDER_NOT_CONFIGURED',
        error: 'CRICKETDATA_API_KEY is not configured.',
      };
    }

    const providerMatchId = this.extractProviderMatchId(matchId);
    if (!providerMatchId) {
      return {
        match: null,
        provider: this.id,
        statusCode: 404,
        code: 'NOT_FOUND',
        error: 'Missing match ID.',
      };
    }

    try {
      const infoUrl = `${CRICKETDATA_BASE_URL}/match_info?apikey=${encodeURIComponent(apiKey)}&id=${encodeURIComponent(providerMatchId)}`;
      const scorecardUrl = `${CRICKETDATA_BASE_URL}/match_scorecard?apikey=${encodeURIComponent(apiKey)}&id=${encodeURIComponent(providerMatchId)}`;

      const [infoRes, scRes] = await Promise.allSettled([
        fetch(infoUrl, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }).then((r) => r.json()),
        fetch(scorecardUrl, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }).then((r) => r.json()),
      ]);

      const infoJson: any = infoRes.status === 'fulfilled' ? infoRes.value : null;
      const scJson: any = scRes.status === 'fulfilled' ? scRes.value : null;

      const base = scJson?.status === 'success' && scJson?.data ? scJson.data : infoJson?.status === 'success' ? infoJson.data : null;
      if (!base) {
        return {
          match: null,
          provider: this.id,
          statusCode: 404,
          code: 'NOT_FOUND',
          error: redactKey(infoJson?.reason || scJson?.reason || 'Match not found on secondary provider.'),
        };
      }

      const normalized = normalizeCricketDataMatch(base, scJson?.status === 'success' ? scJson.data : undefined);
      return {
        match: normalized,
        provider: this.id,
        statusCode: 200,
        code: 'OK',
        ballByBallAvailable: false,
      };
    } catch (err: any) {
      return {
        match: null,
        provider: this.id,
        statusCode: 502,
        code: 'UPSTREAM_ERROR',
        error: redactKey(err?.message || 'Secondary provider error.'),
      };
    }
  }
}

export const secondaryProvidersRegistry: CricketMatchProvider[] = [
  new CricketDataSecondaryProvider(),
];

/**
 * Deduplicates secondary matches against primary Sportmonks matches without
 * erroneously merging unrelated matches that merely share similar team names.
 */
export function deduplicateProviderMatches(
  primaryMatches: NormalizedMatch[],
  secondaryMatches: NormalizedMatch[]
): NormalizedMatch[] {
  const result = [...primaryMatches];
  const seenIds = new Set(primaryMatches.map((m) => m.id));

  // Build strict signatures: date + normalized exact team pair + matchType
  const strictSignatures = new Set(
    primaryMatches
      .filter((m) => m.date)
      .map((m) => {
        const teamsSorted = [
          m.homeTeam.name.toLowerCase().trim(),
          m.awayTeam.name.toLowerCase().trim(),
        ]
          .sort()
          .join('|');
        const fmt = (m.matchType || '').toLowerCase().trim();
        return `${m.date}::${teamsSorted}::${fmt}`;
      })
  );

  for (const candidate of secondaryMatches) {
    if (seenIds.has(candidate.id)) continue;

    if (candidate.date) {
      const teamsSorted = [
        candidate.homeTeam.name.toLowerCase().trim(),
        candidate.awayTeam.name.toLowerCase().trim(),
      ]
        .sort()
        .join('|');
      const fmt = (candidate.matchType || '').toLowerCase().trim();
      const sig = `${candidate.date}::${teamsSorted}::${fmt}`;
      if (strictSignatures.has(sig)) {
        continue;
      }
      strictSignatures.add(sig);
    }

    seenIds.add(candidate.id);
    result.push(candidate);
  }

  return result;
}
