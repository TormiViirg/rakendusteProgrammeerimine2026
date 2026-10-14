import { openDay } from '../../domain/model';
import { harshestGrace, livePieces, lockedFloor } from '../../domain/rules';
import { clipTo, normalise, sameSet, setCovers } from '../../domain/time';
import type { Clock, ConfirmRequest, ConfirmResult, ScheduleBackend } from '../../ports';
import type { ScheduleDto } from './dto';
import { toSchedule } from './mapping';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * In-memory stand-in for the backend. It validates a confirmation with the
 * same domain rules the real one must enforce, so the UI's happy path and its
 * rejections can both be exercised before any server exists. Booking the
 * chosen time to the volunteer's teams is the real backend's job.
 */
export function dummyBackend(dto: ScheduleDto, clock: Clock, latencyMs = 120): ScheduleBackend {
  let schedule = toSchedule(dto);
  return {
    async load() {
      await wait(latencyMs);
      return schedule;
    },
    async confirm(request: ConfirmRequest): Promise<ConfirmResult> {
      await wait(latencyMs);
      const grace = harshestGrace(schedule.teams);
      const now = clock.now();
      const rejected: { day: string; reason: string }[] = [];
      const selections = { ...schedule.selections };
      for (const day of Object.keys(schedule.selections)) {
        const previous = schedule.selections[day];
        const wanted = normalise(request.selections[day] ?? []);
        if (sameSet(wanted, previous.confirmed)) continue;
        const open = openDay(schedule, day);
        const live = livePieces(open, now);
        if (!sameSet(clipTo(wanted, open.pieces), wanted)) rejected.push({ day, reason: 'outside' });
        else if (live.length === 0) rejected.push({ day, reason: 'past' });
        else if (!setCovers(wanted, lockedFloor(open, previous, now, grace))) rejected.push({ day, reason: 'locked' });
        else selections[day] = { ...previous, current: wanted, confirmed: wanted };
      }
      if (rejected.length > 0) return { ok: false, rejected };
      schedule = { ...schedule, selections, comments: { ...request.comments } };
      return { ok: true, schedule };
    },
  };
}
