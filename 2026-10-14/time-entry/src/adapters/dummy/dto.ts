/**
 * The wire format the future backend is expected to speak: plain JSON,
 * every instant an ISO-8601 string in UTC. Nothing outside this folder sees it.
 */
export interface ScheduleDto {
  period: { startUtc: string; endUtc: string; timeZone: string };
  /** The volunteer's teams (positions). Colours are oklch() strings. */
  teams: { id: string; names: Record<string, string>; color: string; graceHours: number }[];
  windows: {
    id: string;
    teamId: string;
    day: string;
    startUtc: string;
    endUtc: string;
    addedSinceSeen?: [string, string][];
  }[];
  availability: {
    day: string;
    startUtc: string;
    endUtc: string;
    /** who put it there; `draft` = chosen by the volunteer but not confirmed yet */
    kind: 'confirmed' | 'draft' | 'leaderAdded' | 'leaderRemoved';
    /** only for team-lead changes: which team's lead */
    teamId?: string;
  }[];
  /** one per day */
  comments: Record<string, string>;
  targets: { dayHours: number; weekHours: number; monthHours: number; periodHours: number };
  cohortQuantiles: { p: number; hours: number }[];
  stepMinutes: number;
  contact: { email: string; phone: string; emailUntilHours: number; callWithinHours: number };
  /** Demo convenience: the "now" this scenario was drawn for. */
  suggestedNowUtc: string;
  /** Demo convenience: the day to open on. */
  suggestedDay?: string;
}
