export type BigMatchRule = readonly [home: string, away: string];
/** Default rules are configurable through the future settings API. */
export const defaultBigMatchRules: readonly BigMatchRule[] = [
  ["Liverpool", "Manchester United"], ["Liverpool", "Manchester City"],
  ["Arsenal", "Chelsea"], ["Arsenal", "Tottenham"], ["Real Madrid", "Barcelona"]
];
