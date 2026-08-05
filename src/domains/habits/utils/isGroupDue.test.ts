import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'

import isGroupDue from './isGroupDue'

const MONDAY_DATE = '2026-07-06'

const time = (hour: number, minute: number) => ({ hour, minute })

const defaultBoundaries = { start: time(8, 0), end: time(20, 0) }

type Params = Parameters<typeof isGroupDue>[0]

const timesPerDay = (value: number, specificDays?: NonNullable<Params['recurrence']>['specificDays']) =>
  ({ type: 'times-per-day', value, specificDays } as const)

const weekdaysOnly = timesPerDay(1, { mo: true, tu: true, we: true, th: true, fr: true, sa: false, su: false })

const isDue = (params: {
  recurrence: Params['recurrence'],
  lastCompleted?: string,
  now: string,
  boundaries?: Params['dayBoundaries'],
}) => isGroupDue({
  recurrence: params.recurrence,
  lastCompletedMs: params.lastCompleted === undefined ? undefined : dayjs(params.lastCompleted).valueOf(),
  now: dayjs(params.now),
  dayBoundaries: params.boundaries ?? defaultBoundaries,
})

describe('isGroupDue', () => {
  it('returns false when recurrence is undefined', () => {
    expect(isDue({ recurrence: undefined, now: `${MONDAY_DATE} 15:00` })).toBe(false)
  })

  it('returns true when nothing has ever been completed and a past occurrence exists', () => {
    expect(isDue({ recurrence: timesPerDay(1), now: `${MONDAY_DATE} 15:00` })).toBe(true)
  })

  it('returns true when the last completed tick is before the most recent occurrence', () => {
    // now 15:00 → most recent occurrence was today 14:00; completed yesterday
    expect(isDue({
      recurrence: timesPerDay(1),
      lastCompleted: '2026-07-05 15:00',
      now: `${MONDAY_DATE} 15:00`,
    })).toBe(true)
  })

  it('returns false when the last completed tick is after the most recent occurrence', () => {
    expect(isDue({
      recurrence: timesPerDay(1),
      lastCompleted: `${MONDAY_DATE} 14:30`,
      now: `${MONDAY_DATE} 15:00`,
    })).toBe(false)
  })

  it('tracks dueness between same-day occurrences', () => {
    // completed after the 08:00 slot but before the most recent one at 14:00
    expect(isDue({
      recurrence: timesPerDay(3),
      lastCompleted: `${MONDAY_DATE} 09:00`,
      now: `${MONDAY_DATE} 15:00`,
    })).toBe(true)
  })

  it('returns false when completed after the latest same-day occurrence', () => {
    expect(isDue({
      recurrence: timesPerDay(3),
      lastCompleted: `${MONDAY_DATE} 14:30`,
      now: `${MONDAY_DATE} 15:00`,
    })).toBe(false)
  })

  it('counts an occurrence lying exactly at now as the most recent one', () => {
    expect(isDue({
      recurrence: timesPerDay(1),
      lastCompleted: '2026-07-05 15:00',
      now: `${MONDAY_DATE} 14:00`,
    })).toBe(true)
  })

  it('returns false when completed exactly at the occurrence instant', () => {
    expect(isDue({
      recurrence: timesPerDay(1),
      lastCompleted: `${MONDAY_DATE} 14:00`,
      now: `${MONDAY_DATE} 15:00`,
    })).toBe(false)
  })

  // A turn spans its whole slot: completing anywhere inside it serves it, and it stays owed
  // until the slot runs out — for the day's last turn, until active hours close.
  describe('turn slots', () => {
    it('stays served when completed ahead of the turn coming due', () => {
      // timesPerDay(3) → turn 2 opens 12:00, comes due 14:00; completed at 13:00 inside it
      expect(isDue({
        recurrence: timesPerDay(3),
        lastCompleted: `${MONDAY_DATE} 13:00`,
        now: `${MONDAY_DATE} 14:30`,
      })).toBe(false)
    })

    it('keeps a turn served after it closes, however early in it the completion landed', () => {
      // T1 [08:00,12:00) served at 09:00, well before its 10:00 due moment; at 13:00 T1 has
      // closed and T2 is open but not due yet, so nothing is behind
      expect(isDue({
        recurrence: timesPerDay(3),
        lastCompleted: `${MONDAY_DATE} 09:00`,
        now: `${MONDAY_DATE} 13:00`,
      })).toBe(false)
    })

    it('treats a completion before and after a turn\'s due moment alike', () => {
      // 09:00 and 10:30 both fall inside T1 — when it comes to serving T1 they are equivalent
      const params = { recurrence: timesPerDay(3), now: `${MONDAY_DATE} 13:00` } as const
      expect(isDue({ ...params, lastCompleted: `${MONDAY_DATE} 09:00` }))
        .toBe(isDue({ ...params, lastCompleted: `${MONDAY_DATE} 10:30` }))
    })

    it('comes due again once the next turn opens', () => {
      // completed 13:00 served turn 2; turn 3 opens 16:00 and comes due 18:00
      expect(isDue({
        recurrence: timesPerDay(3),
        lastCompleted: `${MONDAY_DATE} 13:00`,
        now: `${MONDAY_DATE} 18:00`,
      })).toBe(true)
    })

    it('stays owed for the rest of the day when the last turn is missed', () => {
      // last turn came due 18:00; still owed at 19:59, minutes before active hours close
      expect(isDue({
        recurrence: timesPerDay(3),
        lastCompleted: `${MONDAY_DATE} 15:00`,
        now: `${MONDAY_DATE} 19:59`,
      })).toBe(true)
    })

    it('stays owed past the end of the day', () => {
      // the slot is found from the most recent occurrence, not from now, so at 22:00 this still
      // asks about turn 3's slot [16:00, 20:00) — which 15:00 predates
      expect(isDue({
        recurrence: timesPerDay(3),
        lastCompleted: `${MONDAY_DATE} 15:00`,
        now: `${MONDAY_DATE} 22:00`,
      })).toBe(true)
    })

    it('serves the last turn when completed early inside its slot', () => {
      // turn 3 opens 16:00 and comes due 18:00; completed 16:30 → served for the rest of the day
      expect(isDue({
        recurrence: timesPerDay(3),
        lastCompleted: `${MONDAY_DATE} 16:30`,
        now: `${MONDAY_DATE} 19:30`,
      })).toBe(false)
    })
  })

  it('handles specific days — due on a selected day with no completed tick', () => {
    expect(isDue({ recurrence: weekdaysOnly, now: `${MONDAY_DATE} 10:00` })).toBe(true)
  })

  it('handles specific days — not due on a weekend when completed after Friday\'s occurrence', () => {
    // 2026-07-11 is a Saturday → the most recent occurrence was Friday 14:00
    expect(isDue({
      recurrence: weekdaysOnly,
      lastCompleted: '2026-07-10 15:00',
      now: '2026-07-11 10:00',
    })).toBe(false)
  })

  it('handles cross-midnight day boundaries', () => {
    // 22:00–06:00 boundaries → timesPerDay(1) fires at 02:00, its turn opening at 22:00
    const boundaries = { start: time(22, 0), end: time(6, 0) }
    expect(isDue({
      recurrence: timesPerDay(1),
      lastCompleted: `${MONDAY_DATE} 21:00`,
      now: '2026-07-07 03:00',
      boundaries,
    })).toBe(true)
    expect(isDue({
      recurrence: timesPerDay(1),
      lastCompleted: '2026-07-07 02:30',
      now: '2026-07-07 03:00',
      boundaries,
    })).toBe(false)
  })
})
