import {
  MatchStatusType,
  NormalizedBallCommentary,
  NormalizedExtras,
  NormalizedFallOfWicket,
  NormalizedInnings,
  NormalizedMatch,
  NormalizedPartnership,
  NormalizedPlayerBatter,
  NormalizedPlayerBowler,
} from '../types/cricket';

export function sanitizeHttpUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    // Invalid URL
  }
  return '';
}

export function deriveShortName(name: string, code?: string | null): string {
  if (code && code.trim()) {
    return code.trim().toUpperCase().slice(0, 6);
  }
  const clean = (name || '').trim();
  if (!clean) return 'TBA';
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }
  return clean.slice(0, 3).toUpperCase();
}

export function resolveSafeLogo(imagePath?: unknown): string {
  const safe = sanitizeHttpUrl(imagePath);
  return safe;
}

export function mapSportmonksStatus(statusRaw?: string | null, isLiveFlag?: boolean): MatchStatusType {
  const s = (statusRaw || '').trim().toLowerCase();

  if (
    s.includes('aban') ||
    s.includes('cancl') ||
    s.includes('cancel') ||
    s.includes('no result') ||
    s.includes('finish') ||
    s.includes('complet') ||
    s === 'ft' ||
    s === 'result'
  ) {
    return 'RECENT';
  }

  if (
    s.includes('int.') ||
    s.includes('interrupted') ||
    s.includes('delay') ||
    s.includes('rain') ||
    s.includes('susp') ||
    s.includes('postp')
  ) {
    return 'INTERRUPTED';
  }

  if (s === 'ns' || s.includes('not started') || s.includes('scheduled')) {
    return 'UPCOMING';
  }

  if (
    isLiveFlag ||
    s.includes('1st innings') ||
    s.includes('2nd innings') ||
    s.includes('3rd innings') ||
    s.includes('4th innings') ||
    s.includes('innings break') ||
    s.includes('tea') ||
    s.includes('lunch') ||
    s.includes('dinner') ||
    s.includes('stumps') ||
    s === 'live' ||
    s.includes('in play')
  ) {
    return 'LIVE';
  }

  if (s === '') {
    return 'UPCOMING';
  }

  return 'LIVE';
}

export function mapMatchCategory(leagueType?: string | null, leagueName?: string | null): 'International' | 'Domestic' | 'Franchise' {
  const lt = (leagueType || '').toLowerCase();
  const ln = (leagueName || '').toLowerCase();

  if (
    lt === 'league' ||
    ln.includes('premier league') ||
    ln.includes('ipl') ||
    ln.includes('bbl') ||
    ln.includes('big bash') ||
    ln.includes('psl') ||
    ln.includes('cpl') ||
    ln.includes('sa20') ||
    ln.includes('ilt20') ||
    ln.includes('hundred') ||
    ln.includes('mlc') ||
    ln.includes('bpl') ||
    ln.includes('blast')
  ) {
    return 'Franchise';
  }

  if (
    lt === 'phase' ||
    ln.includes('international') ||
    ln.includes('icc') ||
    ln.includes('world cup') ||
    ln.includes('champions trophy') ||
    ln.includes('ashes') ||
    ln.includes('tour') ||
    ln.includes('t20i') ||
    ln.includes('odi') ||
    ln.includes('test')
  ) {
    return 'International';
  }

  return 'Domestic';
}

function parseScoreboardNumber(scoreboardVal: unknown, fallback: number): number {
  if (typeof scoreboardVal === 'number' && !isNaN(scoreboardVal)) {
    return scoreboardVal;
  }
  if (typeof scoreboardVal === 'string') {
    const match = scoreboardVal.match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return fallback;
}

function parseOversToDecimal(oversVal: unknown): number {
  if (oversVal === null || oversVal === undefined) return 0;
  const str = String(oversVal).trim();
  if (!str) return 0;
  const parts = str.split('.');
  const completed = parseInt(parts[0], 10) || 0;
  const balls = parseInt(parts[1] || '0', 10) || 0;
  return completed + balls / 6;
}

function toNumericOrNull(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function getPlayerDisplayName(playerObj: any, fallbackId?: unknown): string {
  if (playerObj && typeof playerObj === 'object') {
    if (playerObj.fullname && String(playerObj.fullname).trim()) {
      return String(playerObj.fullname).trim();
    }
    const combined = [playerObj.firstname, playerObj.lastname].filter(Boolean).join(' ').trim();
    if (combined) return combined;
    if (playerObj.name && String(playerObj.name).trim()) {
      return String(playerObj.name).trim();
    }
  }
  if (fallbackId !== undefined && fallbackId !== null) {
    return `Player #${fallbackId}`;
  }
  return 'Unknown Player';
}

function formatSportmonksDismissal(row: any, playerLookup: Map<number, string>): { dismissal: string; isNotOut: boolean } {
  const resultName = (row?.result?.name || '').trim();
  const resultLower = resultName.toLowerCase();
  const isWicketFlag = row?.result?.is_wicket;
  const isActive = Boolean(row?.active);

  if (resultLower === 'not out' || resultLower === 'batting') {
    return { dismissal: 'NOT OUT', isNotOut: true };
  }

  if (isActive && !row?.batsmanout_id && isWicketFlag !== true) {
    return { dismissal: 'NOT OUT', isNotOut: true };
  }

  const bowlerName =
    row?.bowler ? getPlayerDisplayName(row.bowler) :
    row?.bowling_player_id ? playerLookup.get(Number(row.bowling_player_id)) : '';
  const catcherName =
    row?.catchstump ? getPlayerDisplayName(row.catchstump) :
    row?.catch_stump_player_id ? playerLookup.get(Number(row.catch_stump_player_id)) : '';
  const runoutName =
    row?.runoutby ? getPlayerDisplayName(row.runoutby) :
    row?.runout_by_id ? playerLookup.get(Number(row.runout_by_id)) : '';

  if (resultLower.includes('catch') || resultLower === 'caught' || resultLower === 'c & b') {
    if (resultLower === 'c & b' && bowlerName) {
      return { dismissal: `c & b ${bowlerName}`, isNotOut: false };
    }
    if (catcherName && bowlerName) {
      return { dismissal: `c ${catcherName} b ${bowlerName}`, isNotOut: false };
    }
    if (bowlerName) {
      return { dismissal: `c & b ${bowlerName}`, isNotOut: false };
    }
  }

  if (resultLower.includes('bowled') || resultLower === 'clean bowled') {
    return { dismissal: bowlerName ? `b ${bowlerName}` : 'b', isNotOut: false };
  }

  if (resultLower.includes('lbw')) {
    return { dismissal: bowlerName ? `lbw b ${bowlerName}` : 'lbw', isNotOut: false };
  }

  if (resultLower.includes('stump')) {
    if (catcherName && bowlerName) {
      return { dismissal: `st ${catcherName} b ${bowlerName}`, isNotOut: false };
    }
    return { dismissal: bowlerName ? `st b ${bowlerName}` : 'stumped', isNotOut: false };
  }

  if (resultLower.includes('run out')) {
    if (runoutName) {
      return { dismissal: `run out (${runoutName})`, isNotOut: false };
    }
    if (catcherName) {
      return { dismissal: `run out (${catcherName})`, isNotOut: false };
    }
    return { dismissal: 'run out', isNotOut: false };
  }

  if (resultLower.includes('hit wicket')) {
    return { dismissal: bowlerName ? `hit wicket b ${bowlerName}` : 'hit wicket', isNotOut: false };
  }

  if (resultName) {
    return {
      dismissal: bowlerName ? `${resultName} b ${bowlerName}` : resultName,
      isNotOut: false,
    };
  }

  if (bowlerName && catcherName) {
    return { dismissal: `c ${catcherName} b ${bowlerName}`, isNotOut: false };
  }
  if (bowlerName) {
    return { dismissal: `b ${bowlerName}`, isNotOut: false };
  }

  if (row?.batsmanout_id) {
    return { dismissal: 'Out', isNotOut: false };
  }

  return { dismissal: '—', isNotOut: false };
}

function isDismissedForFow(row: any, playerLookup: Map<number, string>): boolean {
  if (row?.fow_score === null || row?.fow_score === undefined) return false;
  const resultName = String(row?.result?.name || '').trim().toLowerCase();
  if (
    resultName === 'not out' ||
    resultName === 'batting' ||
    resultName.includes('retired hurt') ||
    resultName.includes('retired not out')
  ) {
    return false;
  }
  if (row?.result?.is_wicket === false) {
    return false;
  }
  const { isNotOut } = formatSportmonksDismissal(row, playerLookup);
  if (isNotOut) {
    return false;
  }
  // Sportmonks may populate fow_score: 0 & fow_balls: 0 on non-dismissed entries without dismissal metadata
  if (
    Number(row?.fow_score) === 0 &&
    Number(row?.fow_balls || 0) === 0 &&
    row?.result?.is_wicket !== true &&
    !row?.batsmanout_id &&
    !row?.bowling_player_id &&
    !row?.bowler
  ) {
    return false;
  }
  return true;
}

function extractInningsExtras(scoreboardRows: any[]): NormalizedExtras | undefined {
  if (!scoreboardRows || scoreboardRows.length === 0) return undefined;

  const extraRow = scoreboardRows.find((s) => String(s?.type || '').toLowerCase() === 'extra');
  const totalRow = scoreboardRows.find((s) => String(s?.type || '').toLowerCase() === 'total');
  const src = extraRow || totalRow;
  if (!src) return undefined;

  const wides = toNumericOrNull(src.wide ?? src.wides);
  const noBalls = toNumericOrNull(src.noball_runs ?? src.noballs ?? src.noball);
  const byes = toNumericOrNull(src.bye ?? src.byes);
  const legByes = toNumericOrNull(src.leg_bye ?? src.legbyes);
  const penalty = toNumericOrNull(src.penalty);

  const hasAnyExtraField =
    wides !== null || noBalls !== null || byes !== null || legByes !== null || penalty !== null;

  if (!hasAnyExtraField && !extraRow) {
    return undefined;
  }

  const w = wides ?? 0;
  const nb = noBalls ?? 0;
  const b = byes ?? 0;
  const lb = legByes ?? 0;
  const p = penalty ?? 0;
  const computedTotal = w + nb + b + lb + p;
  const rawExtraTotal = toNumericOrNull(extraRow?.total);
  const total = rawExtraTotal !== null && rawExtraTotal > 0 ? rawExtraTotal : computedTotal;

  return {
    wides: w,
    noBalls: nb,
    byes: b,
    legByes: lb,
    penalty: p,
    total,
    details: `b ${b}, lb ${lb}, w ${w}, nb ${nb}, p ${p}`,
  };
}

function buildEmptyInnings(teamName: string, teamShort: string, inningsNumber = 1): NormalizedInnings {
  return {
    inningsNumber,
    teamName,
    teamShort,
    score: '0/0',
    runs: null,
    wickets: null,
    overs: '0.0',
    runRate: null,
    batters: [],
    bowlers: [],
    fallOfWickets: [],
    partnerships: [],
    yetToBat: [],
  };
}

function derivePartnershipsFromBalls(
  inningsBalls: any[],
  playerLookup: Map<number, string>
): NormalizedPartnership[] {
  if (!Array.isArray(inningsBalls) || inningsBalls.length === 0) return [];

  const sorted = [...inningsBalls].sort((a, b) => Number(a?.ball || 0) - Number(b?.ball || 0));
  const partnerships: NormalizedPartnership[] = [];

  let currentPair: [string, string] | null = null;
  let runs = 0;
  let balls = 0;

  for (const ball of sorted) {
    const strikerId = Number(ball?.batsman_id || ball?.batsman?.id || 0);
    const nonStrikerId = Number(ball?.batsman_one_on_creeze_id || ball?.non_striker_id || ball?.batsmanout_id || 0);
    const strikerName = ball?.batsman ? getPlayerDisplayName(ball.batsman, strikerId) : playerLookup.get(strikerId) || '';
    const nonStrikerName = nonStrikerId ? playerLookup.get(nonStrikerId) || '' : '';

    if (!currentPair && strikerName && nonStrikerName) {
      currentPair = [strikerName, nonStrikerName].sort() as [string, string];
    }

    const scoreObj = ball?.score || {};
    const ballRuns = Number(scoreObj.runs ?? 0) + Number(scoreObj.bye ?? 0) + Number(scoreObj.leg_bye ?? 0) + Number(scoreObj.noball_runs ?? 0);
    runs += isNaN(ballRuns) ? 0 : ballRuns;
    if (scoreObj.ball === true || (!scoreObj.noball && !scoreObj.wide)) {
      balls += 1;
    }

    const isWicket = Boolean(scoreObj.is_wicket || scoreObj.out || ball?.batsmanout_id);
    if (isWicket && currentPair) {
      partnerships.push({
        batters: `${currentPair[0]} & ${currentPair[1]}`,
        runs,
        balls,
      });
      currentPair = null;
      runs = 0;
      balls = 0;
    }
  }

  if (currentPair && (runs > 0 || balls > 0)) {
    partnerships.push({
      batters: `${currentPair[0]} & ${currentPair[1]}`,
      runs,
      balls,
    });
  }

  return partnerships;
}

export function hasCompleteScorecard(match: NormalizedMatch | null | undefined): boolean {
  if (!match) return false;
  if (Array.isArray(match.innings) && match.innings.length > 0) {
    return match.innings.some(
      (inn) =>
        (Array.isArray(inn.batters) && inn.batters.length > 0) ||
        (Array.isArray(inn.bowlers) && inn.bowlers.length > 0)
    );
  }
  return (
    (match.currentInnings?.batters?.length || 0) > 0 ||
    (match.currentInnings?.bowlers?.length || 0) > 0
  );
}

export function normalizeSportmonksFixture(raw: any): NormalizedMatch {
  const providerId = String(raw?.id || '');
  const id = `sm-${providerId}`;

  const localTeam = raw?.localteam || {};
  const visitorTeam = raw?.visitorteam || {};

  const localTeamId = Number(raw?.localteam_id || localTeam?.id || 0);
  const visitorTeamId = Number(raw?.visitorteam_id || visitorTeam?.id || 0);

  const localName = String(localTeam?.name || 'Home Team').trim();
  const visitorName = String(visitorTeam?.name || 'Away Team').trim();
  const localShort = deriveShortName(localName, localTeam?.code);
  const visitorShort = deriveShortName(visitorName, visitorTeam?.code);

  const teamNameById = new Map<number, { name: string; shortName: string }>();
  if (localTeamId) teamNameById.set(localTeamId, { name: localName, shortName: localShort });
  if (visitorTeamId) teamNameById.set(visitorTeamId, { name: visitorName, shortName: visitorShort });

  // Build player ID -> name lookup from lineup, batting, bowling, balls, manofmatch
  const playerLookup = new Map<number, string>();
  const registerPlayer = (p: any) => {
    if (p && typeof p === 'object' && p.id) {
      playerLookup.set(Number(p.id), getPlayerDisplayName(p, p.id));
    }
  };
  if (Array.isArray(raw?.lineup)) raw.lineup.forEach(registerPlayer);
  if (Array.isArray(raw?.batting)) {
    raw.batting.forEach((b: any) => {
      registerPlayer(b?.batsman);
      registerPlayer(b?.bowler);
      registerPlayer(b?.catchstump);
      registerPlayer(b?.runoutby);
    });
  }
  if (Array.isArray(raw?.bowling)) {
    raw.bowling.forEach((bw: any) => registerPlayer(bw?.bowler));
  }
  if (Array.isArray(raw?.balls)) {
    raw.balls.forEach((ball: any) => {
      registerPlayer(ball?.batsman);
      registerPlayer(ball?.bowler);
    });
  }
  registerPlayer(raw?.manofmatch);

  const runsArr: any[] = Array.isArray(raw?.runs) ? [...raw.runs].sort((a, b) => Number(a?.inning || 0) - Number(b?.inning || 0)) : [];
  const scoreboardsArr: any[] = Array.isArray(raw?.scoreboards) ? raw.scoreboards : [];
  const battingArr: any[] = Array.isArray(raw?.batting) ? raw.batting : [];
  const bowlingArr: any[] = Array.isArray(raw?.bowling) ? raw.bowling : [];
  const ballsArr: any[] = Array.isArray(raw?.balls) ? raw.balls : [];
  const lineupArr: any[] = Array.isArray(raw?.lineup) ? raw.lineup : [];

  const status = mapSportmonksStatus(raw?.status, Boolean(raw?.live));
  const leagueName = String(raw?.league?.name || raw?.stage?.name || 'Cricket Series').trim();
  const roundName = String(raw?.round || '').trim();
  const venueName = String(raw?.venue?.name || 'Venue TBA').trim();
  const city = raw?.venue?.city ? String(raw.venue.city).trim() : null;
  const country = raw?.venue?.country?.name ? String(raw.venue.country.name).trim() : null;

  // Group batting, bowling, scoreboards, balls by innings number
  const inningsNumbersSet = new Set<number>();
  runsArr.forEach((r, idx) => inningsNumbersSet.add(Number(r?.inning || idx + 1)));
  scoreboardsArr.forEach((s, idx) => inningsNumbersSet.add(parseScoreboardNumber(s?.scoreboard, idx + 1)));
  battingArr.forEach((b) => inningsNumbersSet.add(parseScoreboardNumber(b?.scoreboard, 1)));
  bowlingArr.forEach((bw) => inningsNumbersSet.add(parseScoreboardNumber(bw?.scoreboard, 1)));

  const inningsNumbers = Array.from(inningsNumbersSet).sort((a, b) => a - b);

  const innings: NormalizedInnings[] = inningsNumbers.map((innNum) => {
    const runRow = runsArr.find((r) => Number(r?.inning) === innNum);
    const sbRows = scoreboardsArr.filter((s) => parseScoreboardNumber(s?.scoreboard, -1) === innNum);
    const totalSbRow = sbRows.find((s) => String(s?.type || '').toLowerCase() === 'total') || sbRows[0];

    const innBatRows = battingArr
      .filter((b) => parseScoreboardNumber(b?.scoreboard, 1) === innNum)
      .sort((a, b) => Number(a?.sort ?? 999) - Number(b?.sort ?? 999));

    const innBowlRows = bowlingArr.filter((bw) => parseScoreboardNumber(bw?.scoreboard, 1) === innNum);
    const innBallRows = ballsArr.filter((bl) => parseScoreboardNumber(bl?.scoreboard, 1) === innNum);

    // Resolve batting team ID
    const battingTeamId = Number(
      runRow?.team_id ||
      totalSbRow?.team_id ||
      innBatRows[0]?.team_id ||
      0
    );
    const battingTeamMeta = teamNameById.get(battingTeamId) || (innNum % 2 === 1
      ? { name: localName, shortName: localShort }
      : { name: visitorName, shortName: visitorShort });

    const totalRuns = toNumericOrNull(runRow?.score ?? totalSbRow?.total);
    const totalWickets = toNumericOrNull(runRow?.wickets ?? totalSbRow?.wickets);
    const oversRaw = runRow?.overs ?? totalSbRow?.overs;
    const oversStr = oversRaw !== undefined && oversRaw !== null && oversRaw !== '' ? String(oversRaw) : '0.0';
    const oversDecimal = parseOversToDecimal(oversStr);
    const runRate =
      totalRuns !== null && oversDecimal > 0
        ? parseFloat((totalRuns / oversDecimal).toFixed(2))
        : null;

    const scoreDisplay =
      totalRuns !== null
        ? totalWickets !== null && totalWickets < 10
          ? `${totalRuns}/${totalWickets}`
          : totalWickets === 10
          ? `${totalRuns}`
          : `${totalRuns}/0`
        : '—';

    const batters: NormalizedPlayerBatter[] = innBatRows.map((b) => {
      const bRuns = toNumericOrNull(b?.score);
      const bBalls = toNumericOrNull(b?.ball ?? b?.balls);
      const bFours = toNumericOrNull(b?.four_x);
      const bSixes = toNumericOrNull(b?.six_x);
      let sr: number | string = '—';
      const rawRate = toNumericOrNull(b?.rate);
      if (rawRate !== null) {
        sr = Number(rawRate.toFixed(2));
      } else if (bRuns !== null && bBalls !== null && bBalls > 0) {
        sr = Number(((bRuns / bBalls) * 100).toFixed(2));
      } else if (bRuns === 0 && bBalls === 0) {
        sr = 0;
      }

      const { dismissal, isNotOut } = formatSportmonksDismissal(b, playerLookup);

      return {
        name: b?.batsman ? getPlayerDisplayName(b.batsman, b?.player_id) : playerLookup.get(Number(b?.player_id)) || `Player #${b?.player_id || ''}`,
        runs: bRuns ?? '—',
        balls: bBalls ?? '—',
        fours: bFours ?? '—',
        sixes: bSixes ?? '—',
        sr,
        isStriker: Boolean(b?.active),
        isNotOut,
        dismissal,
      };
    });

    const bowlers: NormalizedPlayerBowler[] = innBowlRows.map((bw) => {
      const bwOvers = bw?.overs !== undefined && bw?.overs !== null && bw?.overs !== '' ? bw.overs : '—';
      const bwMaidens = toNumericOrNull(bw?.medians ?? bw?.maidens ?? bw?.medals);
      const bwRuns = toNumericOrNull(bw?.runs);
      const bwWickets = toNumericOrNull(bw?.wickets);
      const bwWides = toNumericOrNull(bw?.wide ?? bw?.wides);
      const bwNoBalls = toNumericOrNull(bw?.noball ?? bw?.noballs);
      let economy: number | string = '—';
      const rawEcon = toNumericOrNull(bw?.rate);
      if (rawEcon !== null) {
        economy = Number(rawEcon.toFixed(2));
      } else if (bwRuns !== null) {
        const decOv = parseOversToDecimal(bwOvers);
        if (decOv > 0) {
          economy = Number((bwRuns / decOv).toFixed(2));
        }
      }

      return {
        name: bw?.bowler ? getPlayerDisplayName(bw.bowler, bw?.player_id) : playerLookup.get(Number(bw?.player_id)) || `Bowler #${bw?.player_id || ''}`,
        overs: bwOvers,
        maidens: bwMaidens ?? '—',
        runs: bwRuns ?? '—',
        wickets: bwWickets ?? '—',
        economy,
        wides: bwWides ?? '—',
        noBalls: bwNoBalls ?? '—',
        isBowling: Boolean(bw?.active),
      };
    });

    // Fall of Wickets strictly from confirmed dismissed batters (excluding not-out entries)
    const fowCandidates = innBatRows
      .filter((b) => isDismissedForFow(b, playerLookup))
      .sort((a, b) => {
        const ovDiff = parseOversToDecimal(a?.fow_balls) - parseOversToDecimal(b?.fow_balls);
        if (ovDiff !== 0) return ovDiff;
        return Number(a?.fow_score || 0) - Number(b?.fow_score || 0);
      });

    const fallOfWickets: NormalizedFallOfWicket[] = fowCandidates.map((b, idx) => ({
      batter: b?.batsman ? getPlayerDisplayName(b.batsman, b?.player_id) : playerLookup.get(Number(b?.player_id)) || 'Batter',
      score: `${b.fow_score}/${idx + 1}`,
      over: b?.fow_balls !== null && b?.fow_balls !== undefined ? String(b.fow_balls) : '—',
      wicketNumber: idx + 1,
    }));

    // Partnerships strictly from verified balls if available
    const partnerships = derivePartnershipsFromBalls(innBallRows, playerLookup);

    // Yet to Bat strictly from verified lineup if present
    const battedPlayerIds = new Set(innBatRows.map((b) => Number(b?.player_id)).filter(Boolean));
    const yetToBat: string[] = lineupArr
      .filter((p) => {
        const pTeamId = Number(p?.lineup?.team_id || p?.team_id || 0);
        return battingTeamId && pTeamId === battingTeamId && !battedPlayerIds.has(Number(p?.id));
      })
      .map((p) => getPlayerDisplayName(p, p?.id));

    return {
      inningsNumber: innNum,
      teamName: battingTeamMeta.name,
      teamShort: battingTeamMeta.shortName,
      score: scoreDisplay,
      runs: totalRuns,
      wickets: totalWickets,
      overs: oversStr,
      runRate,
      batters,
      bowlers,
      fallOfWickets,
      partnerships,
      yetToBat,
      extras: extractInningsExtras(sbRows),
    };
  });

  // Compute teamA / teamB scores from runs / innings
  const getTeamLatestRun = (teamId: number, fallbackTeamName: string) => {
    const teamRuns = runsArr.filter((r) => Number(r?.team_id) === teamId);
    if (teamRuns.length > 0) {
      const latest = teamRuns[teamRuns.length - 1];
      const w = toNumericOrNull(latest?.wickets);
      const s = toNumericOrNull(latest?.score);
      const scoreStr = s !== null ? (w !== null && w < 10 ? `${s}/${w}` : `${s}`) : null;
      return {
        score: scoreStr,
        wickets: w,
        overs: latest?.overs !== undefined && latest?.overs !== null ? String(latest.overs) : null,
      };
    }
    const matchingInn = innings.filter((inn) => inn.teamName === fallbackTeamName);
    if (matchingInn.length > 0) {
      const latest = matchingInn[matchingInn.length - 1];
      return {
        score: latest.score !== '—' ? latest.score : null,
        wickets: latest.wickets,
        overs: latest.overs !== '0.0' ? latest.overs : null,
      };
    }
    return { score: null, wickets: null, overs: null };
  };

  const localSummary = getTeamLatestRun(localTeamId, localName);
  const visitorSummary = getTeamLatestRun(visitorTeamId, visitorName);

  const currentInnings =
    innings.length > 0
      ? innings[innings.length - 1]
      : buildEmptyInnings(localName, localShort, 1);

  // Commentary & Recent Balls strictly from Sportmonks `balls` include (if available in plan)
  const sortedBalls = [...ballsArr].sort((a, b) => {
    const innDiff = parseScoreboardNumber(b?.scoreboard, 1) - parseScoreboardNumber(a?.scoreboard, 1);
    if (innDiff !== 0) return innDiff;
    return parseOversToDecimal(b?.ball) - parseOversToDecimal(a?.ball);
  });
  const commentary: NormalizedBallCommentary[] = sortedBalls.slice(0, 80).map((b, idx) => {
    const scoreObj = b?.score || {};
    const runsScored = Number(scoreObj?.runs ?? 0);
    const isFour = Boolean(scoreObj?.four);
    const isSix = Boolean(scoreObj?.six);
    const isWicket = Boolean(scoreObj?.is_wicket || scoreObj?.out || b?.batsmanout_id);
    const batterName = b?.batsman ? getPlayerDisplayName(b.batsman, b?.batsman_id) : playerLookup.get(Number(b?.batsman_id)) || 'Batter';
    const bowlerName = b?.bowler ? getPlayerDisplayName(b.bowler, b?.bowler_id) : playerLookup.get(Number(b?.bowler_id)) || 'Bowler';
    const eventLabel = String(scoreObj?.name || (isWicket ? 'WICKET' : isSix ? 'SIX' : isFour ? 'FOUR' : `${runsScored} run(s)`)).trim();

    return {
      id: `sm-ball-${b?.id || idx}`,
      overNumber: b?.ball !== undefined && b?.ball !== null ? String(b.ball) : '0.0',
      runs: isNaN(runsScored) ? 0 : runsScored,
      isWicket,
      isBoundary: isFour || isSix,
      isSix,
      description: `${bowlerName} to ${batterName}, ${eventLabel}`,
      bowler: bowlerName,
      batter: batterName,
      timestamp: b?.updated_at ? new Date(b.updated_at).toLocaleTimeString() : '',
      tag: isWicket ? 'Wicket' : isSix ? 'Six' : isFour ? 'Four' : undefined,
    };
  });

  const currentInnBalls = sortedBalls.filter(
    (b) => parseScoreboardNumber(b?.scoreboard, currentInnings.inningsNumber) === currentInnings.inningsNumber
  );
  const recentBallsSource = currentInnBalls.length > 0 ? currentInnBalls : sortedBalls;

  const recentBalls: string[] = [...recentBallsSource]
    .slice(0, 8)
    .reverse()
    .map((b) => {
      const s = b?.score || {};
      if (s?.is_wicket || s?.out || b?.batsmanout_id) return 'W';
      if (s?.six) return '6';
      if (s?.four) return '4';
      if (s?.wide) return 'WD';
      if (s?.noball) return 'NB';
      return String(s?.runs ?? 0);
    });

  // Toss, Winner, Player of the Match
  const tossWinnerTeam =
    raw?.tosswon ? String(raw.tosswon.name || '').trim() :
    raw?.toss_won_team_id ? teamNameById.get(Number(raw.toss_won_team_id))?.name || null : null;
  const rawDecision = raw?.elected ? String(raw.elected).trim().toLowerCase() : null;
  const tossDecision =
    rawDecision === 'batting' ? 'bat' :
    rawDecision === 'bowling' ? 'bowl' :
    raw?.elected ? String(raw.elected).trim() : null;
  const tossText =
    tossWinnerTeam && tossDecision
      ? `${tossWinnerTeam} won the toss and elected to ${tossDecision}`
      : tossWinnerTeam
      ? `${tossWinnerTeam} won the toss`
      : undefined;

  const winnerName =
    raw?.winnerteam ? String(raw.winnerteam.name || '').trim() :
    raw?.winner_team_id ? teamNameById.get(Number(raw.winner_team_id))?.name || null : null;

  const playerOfMatch = raw?.manofmatch ? getPlayerDisplayName(raw.manofmatch, raw?.man_of_match_id) : null;

  const umpiresList = [raw?.firstumpire, raw?.secondumpire]
    .filter(Boolean)
    .map((u: any) => getPlayerDisplayName(u, u?.id))
    .filter(Boolean);

  const noteText = raw?.note ? String(raw.note).trim() : '';
  const statusText =
    noteText ||
    (status === 'UPCOMING' && raw?.starting_at
      ? `Starts ${new Date(raw.starting_at).toUTCString()}`
      : String(raw?.status || status));

  // Target & Required Run Rate for live chases if runs/type indicate limited overs
  let target: number | null = toNumericOrNull(raw?.target);
  if (target === null && runsArr.length === 2 && status === 'LIVE' && currentInnings.inningsNumber === 2) {
    const firstInnRun = runsArr.find((r) => Number(r?.inning) === 1) || runsArr[0];
    const firstInnScore = toNumericOrNull(firstInnRun?.score);
    if (firstInnScore !== null) {
      target = firstInnScore + 1;
    }
  }

  let requiredRuns: number | null = null;
  let requiredBalls: number | null = null;
  let rrr: number | undefined;
  const matchTypeUpper = String(raw?.type || '').toUpperCase();
  const maxOversForType =
    matchTypeUpper.includes('T20') ? 20 :
    matchTypeUpper === 'ODI' || matchTypeUpper === 'LIST A' ? 50 :
    matchTypeUpper === 'T10' ? 10 : null;

  if (target !== null && currentInnings.runs !== null && status === 'LIVE') {
    requiredRuns = Math.max(0, target - currentInnings.runs);
    if (maxOversForType) {
      const ovParts = currentInnings.overs.split('.');
      const ballsBowled = (parseInt(ovParts[0], 10) || 0) * 6 + (parseInt(ovParts[1] || '0', 10) || 0);
      requiredBalls = Math.max(0, maxOversForType * 6 - ballsBowled);
      if (requiredBalls > 0 && requiredRuns > 0) {
        rrr = Number(((requiredRuns / requiredBalls) * 6).toFixed(2));
      }
    }
  }

  const crr = currentInnings.runRate ?? undefined;

  const titleParts = [roundName || leagueName, venueName !== 'Venue TBA' ? venueName : ''].filter(Boolean);

  return {
    id,
    matchId: id,
    provider: 'sportmonks',
    providerMatchId: providerId,
    tournament: leagueName,
    category: mapMatchCategory(raw?.league?.type, leagueName),
    title: titleParts.join(' • ') || `${localName} vs ${visitorName}`,
    matchType: raw?.type ? String(raw.type) : undefined,
    date: raw?.starting_at ? String(raw.starting_at).slice(0, 10) : null,
    venue: venueName,
    city,
    country,
    status,
    startTime: raw?.starting_at ? String(raw.starting_at) : null,
    homeTeam: {
      name: localName,
      shortName: localShort,
      score: localSummary.score,
      wickets: localSummary.wickets,
      overs: localSummary.overs,
      logo: resolveSafeLogo(localTeam?.image_path),
    },
    awayTeam: {
      name: visitorName,
      shortName: visitorShort,
      score: visitorSummary.score,
      wickets: visitorSummary.wickets,
      overs: visitorSummary.overs,
      logo: resolveSafeLogo(visitorTeam?.image_path),
    },
    target,
    requiredRuns,
    requiredBalls,
    runRate: currentInnings.runRate,
    result: status === 'RECENT' ? (noteText || (winnerName ? `${winnerName} won` : null)) : null,
    winner: winnerName,
    tossWinner: tossWinnerTeam,
    tossDecision,
    playerOfMatch,
    statusText,
    sources: [
      {
        title: 'Sportmonks Cricket API',
        url: 'https://www.sportmonks.com/cricket-api/',
      },
    ],
    sourceUrl: 'https://www.sportmonks.com/cricket-api/',
    ballByBallSupported: ballsArr.length > 0,

    // UI Compatibility fields
    teamA: {
      name: localName,
      shortName: localShort,
      logo: resolveSafeLogo(localTeam?.image_path),
      score: localSummary.score || (status === 'UPCOMING' ? 'TBA' : 'Yet to bat'),
      overs: localSummary.overs || '',
    },
    teamB: {
      name: visitorName,
      shortName: visitorShort,
      logo: resolveSafeLogo(visitorTeam?.image_path),
      score: visitorSummary.score || (status === 'UPCOMING' ? 'TBA' : 'Yet to bat'),
      overs: visitorSummary.overs || '',
    },
    crr,
    rrr,
    recentBalls,
    currentInnings,
    commentary,
    innings: innings.length > 0 ? innings : undefined,
    lastUpdated: new Date().toISOString(),
    toss: tossText,
    matchSummary: noteText || undefined,
    umpires: umpiresList.length > 0 ? umpiresList.join(', ') : undefined,
    rainDelayDetails:
      status === 'INTERRUPTED'
        ? {
            interruptedAt: currentInnings.overs !== '0.0' ? `${currentInnings.overs} overs` : 'In play',
            expectedResume: 'Awaiting official umpire inspection',
          }
        : undefined,
  };
}
