import type { DayKey, Zone } from '../domain/calendar';
import type { ZoneFactory } from '../ports';

/** Zone adapter on top of Intl – no date library needed. */
export const intlZone: ZoneFactory = (timeZone: string): Zone => {
  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const read = (instant: number) => {
    const p: Record<string, number> = {};
    for (const part of format.formatToParts(new Date(instant))) {
      if (part.type !== 'literal') p[part.type] = Number(part.value);
    }
    return p;
  };
  const offsetAt = (instant: number): number => {
    const p = read(instant);
    const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return wall - Math.floor(instant / 1000) * 1000;
  };
  const starts = new Map<DayKey, number>();
  return {
    startOfDay(day) {
      const cached = starts.get(day);
      if (cached !== undefined) return cached;
      const [y, m, d] = day.split('-').map(Number);
      const wall = Date.UTC(y, m - 1, d);
      let instant = wall - offsetAt(wall);
      instant = wall - offsetAt(instant);
      starts.set(day, instant);
      return instant;
    },
    dayOf(instant) {
      const p = read(instant);
      return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
    },
    clockOf(instant) {
      const p = read(instant);
      return p.hour * 60 + p.minute;
    },
  };
};
