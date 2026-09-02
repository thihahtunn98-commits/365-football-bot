/** Provider boundary for the Phase 2 API-Football implementation. */
export interface LiveScoreProvider { getMatch(matchId: string): Promise<unknown>; getLiveMatches(): Promise<unknown[]>; }
