import { describe, expect, it } from 'vitest';
import { buildScale, cellState, extentsOf, hourPieces, planDay, slotsOf } from '../../src/domain/grid';
import { EET, openOf, selection, span, windowOf } from './fixtures';

const DAY = '2026-11-05';
const scaleFor = (...windows: ReturnType<typeof windowOf>[]) => buildScale(windows.flatMap((w) => extentsOf(EET, openOf(w))));

describe('row scale', () => {
  it.each([
    { id: 'EC-SCALE-01', boundary: 'daytime only, whole hours', from: '10:00', to: '14:00', main: 4, night: 0 },
    { id: 'BV-SCALE-02', boundary: 'starts on the half hour: first row is a half row', from: '09:30', to: '14:00', main: 5, night: 0 },
    { id: 'BV-SCALE-03', boundary: 'ends exactly at midnight: no night section', from: '20:00', to: '24:00', main: 4, night: 0 },
    { id: 'BV-SCALE-04', boundary: 'ends 5 minutes past midnight: one night row', from: '20:00', to: '24:05', main: 4, night: 1 },
    { id: 'EC-SCALE-05', boundary: 'past midnight to 02:30', from: '20:30', to: '26:30', main: 4, night: 3 },
    { id: 'BV-SCALE-06', boundary: 'a full 24 hours, 08:00 → 08:00', from: '08:00', to: '32:00', main: 16, night: 8 },
  ])('$id $boundary', ({ from, to, main, night }) => {
    const scale = scaleFor(windowOf('a', DAY, from, to));
    expect([scale.mainCount, scale.nightCount]).toEqual([main, night]);
  });

  it('EC-SCALE-07 the longest open area sets the rows for every visible day', () => {
    const scale = scaleFor(windowOf('a', '2026-11-04', '12:00', '26:00'), windowOf('a', DAY, '09:30', '21:00'));
    expect(scale.rows[0]).toMatchObject({ from: 570, to: 600 });
    expect(scale.rows[scale.rows.length - 1]).toMatchObject({ from: 1500, to: 1560, night: true });
  });
  it('BV-SCALE-08 no windows at all: an empty scale, not a crash', () => {
    expect(buildScale([])).toEqual({ rows: [], mainCount: 0, nightCount: 0 });
  });
  it('EC-SCALE-09 hour pieces never straddle a whole hour', () => {
    expect(hourPieces(570, 700)).toEqual([{ from: 570, to: 600 }, { from: 600, to: 660 }, { from: 660, to: 700 }]);
  });
});

describe('B2B-48H: two back-to-back windows covering 48 hours', () => {
  const thu = windowOf('a', '2026-11-05', '08:00', '32:00');
  const fri = windowOf('a', '2026-11-06', '08:00', '32:00');
  const scale = scaleFor(thu, fri);
  it('BV-B2B-01 the windows touch but do not overlap', () => {
    expect(thu.interval.end).toBe(fri.interval.start);
    expect(fri.interval.end - thu.interval.start).toBe(48 * 3_600_000);
  });
  it('BV-B2B-02 each day gets 16 day rows + 8 night rows and no crossed-out block', () => {
    for (const w of [thu, fri]) {
      const plan = planDay(EET, openOf(w), scale);
      expect(plan.blocks.every((b) => b.kind === 'cell')).toBe(true);
      expect(plan.blocks).toHaveLength(24);
    }
  });
  it("BV-B2B-03 Thursday's last night cell ends exactly where Friday's first cell starts", () => {
    const last = planDay(EET, openOf(thu), scale).blocks.at(-1)!;
    const first = planDay(EET, openOf(fri), scale).blocks[0];
    expect(last.kind === 'cell' && first.kind === 'cell' && last.spans[0].end === first.spans[0].start).toBe(true);
  });
  it('BV-B2B-04 48 one-hour slots in total', () => {
    expect(slotsOf(EET, openOf(thu)).length + slotsOf(EET, openOf(fri)).length).toBe(48);
  });
});

describe('crossed-out blocks', () => {
  const scale = scaleFor(windowOf('a', '2026-11-02', '09:30', '26:00')); // 15 day rows (09:30 … 24:00) + 2 night rows
  const none = { day: DAY, pieces: [], teamIds: [], addedSinceSeen: [] };
  it('EC-CLOSED-01 a day with no window: one block for the day, one for the night – never one across midnight', () => {
    expect(planDay(EET, none, scale).blocks).toEqual([
      { kind: 'closed', fromRow: 0, toRow: 14, night: false },
      { kind: 'closed', fromRow: 15, toRow: 16, night: true },
    ]);
  });
  it('BV-CLOSED-02 without a night section the closed day is a single block', () => {
    const dayOnly = scaleFor(windowOf('a', '2026-11-02', '09:30', '24:00'));
    expect(planDay(EET, none, dayOnly).blocks).toEqual([{ kind: 'closed', fromRow: 0, toRow: 14, night: false }]);
  });
  it('EC-CLOSED-03 a later start leaves one block on top (12:00 start under a 09:30 scale)', () => {
    const plan = planDay(EET, openOf(windowOf('a', '2026-11-04', '12:00', '26:00')), scale);
    expect(plan.blocks[0]).toEqual({ kind: 'closed', fromRow: 0, toRow: 2, night: false });
    expect(plan.blocks.filter((b) => b.kind === 'closed')).toHaveLength(1);
  });
  it('BV-CLOSED-04 an early end: the block stops at midnight and a second one covers the night', () => {
    const plan = planDay(EET, openOf(windowOf('a', DAY, '09:30', '21:00')), scale);
    expect(plan.blocks.filter((b) => b.kind === 'closed')).toEqual([
      { kind: 'closed', fromRow: 12, toRow: 14, night: false },
      { kind: 'closed', fromRow: 15, toRow: 16, night: true },
    ]);
  });
  it('BV-CLOSED-05 a window starting mid-row keeps the row, clipped to the window', () => {
    const plan = planDay(EET, openOf(windowOf('b', '2026-11-03', '20:30', '26:00')), scale);
    const first = plan.blocks.find((b) => b.kind === 'cell')!;
    expect(first.kind === 'cell' && first.spans).toEqual([span('2026-11-03', '20:30', '21:00')]);
  });
});

describe('sub-hour gaps between two pieces', () => {
  const a = windowOf('a', DAY, '09:30', '17:30');
  const cellsOf = (b: ReturnType<typeof windowOf>) => {
    const open = openOf(a, b);
    return planDay(EET, open, scaleFor(a, b)).blocks;
  };
  it('BV-GAP-01 a 15-minute gap inside one row: one cell with two spans and the gap as a closed band', () => {
    const blocks = cellsOf(windowOf('b', DAY, '17:45', '22:00'));
    const row17 = blocks.find((x) => x.kind === 'cell' && x.row === 8)!; // 09:30 is row 0 → 17:00 is row 8
    expect(row17).toEqual({
      kind: 'cell',
      row: 8,
      spans: [span(DAY, '17:00', '17:30'), span(DAY, '17:45', '18:00')],
      gaps: [{ from: 0.5, to: 0.75 }],
    });
    expect(blocks.filter((x) => x.kind === 'closed')).toHaveLength(0);
  });
  it('BV-GAP-02 a gap of exactly one aligned hour is a crossed-out block, not a band', () => {
    const b = windowOf('b', DAY, '18:30', '22:00');
    const aa = windowOf('a', DAY, '09:30', '17:30');
    const blocks = planDay(EET, openOf(aa, b), scaleFor(aa, b));
    // 17:30–18:30: row 17 has a band 17:30–18:00, row 18 has a band 18:00–18:30 – no whole closed row
    expect(blocks.blocks.filter((x) => x.kind === 'closed')).toHaveLength(0);
    const row17 = blocks.blocks.find((x) => x.kind === 'cell' && x.row === 8)!;
    const row18 = blocks.blocks.find((x) => x.kind === 'cell' && x.row === 9)!;
    expect(row17.kind === 'cell' && row17.gaps).toEqual([{ from: 0.5, to: 1 }]);
    expect(row18.kind === 'cell' && row18.gaps).toEqual([{ from: 0, to: 0.5 }]);
  });
  it('BV-GAP-03 pieces ending and starting on the hour: a whole closed row between them', () => {
    const aa = windowOf('a', DAY, '09:30', '17:00');
    const b = windowOf('b', DAY, '18:00', '22:00');
    const blocks = planDay(EET, openOf(aa, b), scaleFor(aa, b)).blocks;
    expect(blocks.filter((x) => x.kind === 'closed')).toEqual([{ kind: 'closed', fromRow: 8, toRow: 8, night: false }]);
  });
  it('BV-GAP-04 a piece starting 5 minutes into a row set by another day: the band is the first twelfth of the row', () => {
    const late = windowOf('a', DAY, '10:05', '12:00');
    const other = windowOf('a', '2026-11-06', '10:00', '12:00'); // sets the row scale to start at 10:00
    const first = planDay(EET, openOf(late), scaleFor(late, other)).blocks[0];
    expect(first.kind === 'cell' && first.gaps).toEqual([{ from: 0, to: 1 / 12 }]);
  });
  it('BV-GAP-05 alone on the page, that same piece starts its own first row at 10:05 – no band', () => {
    const late = windowOf('a', DAY, '10:05', '12:00');
    const first = planDay(EET, openOf(late), scaleFor(late)).blocks[0];
    expect(first.kind === 'cell' && first.gaps).toEqual([]);
  });
  it('BV-GAP-06 the gap row still counts as one slot for the statistics', () => {
    const open = openOf(a, windowOf('b', DAY, '17:45', '22:00'));
    expect(slotsOf(EET, open)).toHaveLength(13); // 09:30 … 22:00 = 13 rows, none skipped
  });
});

describe('two teams on one day are one open area', () => {
  const a = windowOf('a', DAY, '09:30', '18:00');
  it('EC-MERGE-01 windows apart: one column with a crossed-out gap between them', () => {
    const open = openOf(a, windowOf('b', DAY, '20:30', '26:30'));
    expect(open.pieces).toHaveLength(2);
    expect(open.teamIds).toEqual(['a', 'b']);
    const plan = planDay(EET, open, scaleFor(a, windowOf('b', DAY, '20:30', '26:30')));
    const closed = plan.blocks.filter((b) => b.kind === 'closed');
    expect(closed).toEqual([{ kind: 'closed', fromRow: 9, toRow: 10, night: false }]); // 18:00–20:00
  });
  it('EC-MERGE-02 overlapping windows merge into one piece', () => {
    expect(openOf(a, windowOf('b', DAY, '15:00', '25:00')).pieces).toEqual([span(DAY, '09:30', '25:00')]);
  });
  it('BV-MERGE-03 back-to-back windows merge too', () => {
    expect(openOf(a, windowOf('b', DAY, '18:00', '22:00')).pieces).toEqual([span(DAY, '09:30', '22:00')]);
  });
});

describe('cell states', () => {
  const w = { ...windowOf('a', DAY, '09:30', '21:00'), addedSinceSeen: [span(DAY, '19:00', '21:00')] };
  const open = openOf(w);
  const cell = span(DAY, '10:00', '11:00');
  const lead = { ...cell, teamId: 'a' };
  const LOCKED = { past: false, locked: true };
  const OPEN = { past: false, locked: false };
  it.each([
    { id: 'EC-CELL-01', klass: 'nothing there', sel: selection(), status: OPEN, at: cell, expected: 'free' },
    { id: 'EC-CELL-02', klass: 'chosen, unlocked', sel: selection({ current: [cell], confirmed: [cell] }), status: OPEN, at: cell, expected: 'selected' },
    { id: 'EC-CELL-03', klass: 'chosen and confirmed, locked', sel: selection({ current: [cell], confirmed: [cell] }), status: LOCKED, at: cell, expected: 'selectedLocked' },
    { id: 'EC-CELL-04', klass: 'chosen after the lock, not confirmed', sel: selection({ current: [cell] }), status: LOCKED, at: cell, expected: 'selected' },
    { id: 'EC-CELL-05', klass: 'team lead added', sel: selection({ leaderAdded: [lead] }), status: OPEN, at: cell, expected: 'leaderAdded' },
    { id: 'EC-CELL-06', klass: 'team lead removed', sel: selection({ leaderRemoved: [lead] }), status: OPEN, at: cell, expected: 'leaderRemoved' },
    { id: 'EC-CELL-07', klass: 'added by the admin since last seen', sel: selection(), status: OPEN, at: span(DAY, '19:00', '20:00'), expected: 'new' },
    { id: 'BV-CELL-08', klass: 'selection touches the cell edge only', sel: selection({ current: [span(DAY, '11:00', '12:00')] }), status: OPEN, at: cell, expected: 'free' },
    { id: 'BV-CELL-09', klass: 'selection covers 5 minutes of the cell', sel: selection({ current: [span(DAY, '10:55', '12:00')] }), status: OPEN, at: cell, expected: 'selected' },
  ])('$id $klass', ({ sel, status, at: where, expected }) => {
    expect(cellState([where], sel, open, status)).toBe(expected);
  });
});
