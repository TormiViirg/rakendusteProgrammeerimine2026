import type { DaySelection, LeaderPiece, Schedule } from '../../domain/model';
import { HOUR, MINUTE, normalise, union, type Interval } from '../../domain/time';
import type { ScheduleDto } from './dto';

const at = (iso: string): number => Date.parse(iso);
const span = (a: string, b: string): Interval => ({ start: at(a), end: at(b) });

/** Anti-corruption layer: DTO → domain model. */
export function toSchedule(dto: ScheduleDto): Schedule {
  const selections: Record<string, DaySelection> = {};
  const days = new Set([...dto.windows.map((w) => w.day), ...dto.availability.map((a) => a.day)]);
  for (const day of days) {
    const mine = dto.availability.filter((a) => a.day === day);
    const pick = (kind: string) => normalise(mine.filter((a) => a.kind === kind).map((a) => span(a.startUtc, a.endUtc)));
    const leader = (kind: string): LeaderPiece[] =>
      mine
        .filter((a) => a.kind === kind)
        .map((a) => ({ ...span(a.startUtc, a.endUtc), teamId: a.teamId ?? dto.teams[0].id }))
        .sort((a, b) => a.start - b.start);
    const confirmed = pick('confirmed');
    selections[day] = {
      confirmed,
      current: union(confirmed, pick('draft')),
      leaderAdded: leader('leaderAdded'),
      leaderRemoved: leader('leaderRemoved'),
    };
  }
  return {
    period: { interval: span(dto.period.startUtc, dto.period.endUtc), timeZone: dto.period.timeZone },
    teams: dto.teams.map((t) => ({ id: t.id, names: t.names, color: t.color, graceMs: t.graceHours * HOUR })),
    windows: dto.windows.map((w) => ({
      id: w.id,
      teamId: w.teamId,
      day: w.day,
      interval: span(w.startUtc, w.endUtc),
      addedSinceSeen: normalise((w.addedSinceSeen ?? []).map(([a, b]) => span(a, b))),
    })),
    selections,
    comments: { ...dto.comments },
    targets: {
      dayMs: dto.targets.dayHours * HOUR,
      weekMs: dto.targets.weekHours * HOUR,
      monthMs: dto.targets.monthHours * HOUR,
      periodMs: dto.targets.periodHours * HOUR,
    },
    cohort: { quantiles: dto.cohortQuantiles.map((q) => ({ p: q.p, ms: q.hours * HOUR })) },
    stepMs: dto.stepMinutes * MINUTE,
    contact: { ...dto.contact },
  };
}
