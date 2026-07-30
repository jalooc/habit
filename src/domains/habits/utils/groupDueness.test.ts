import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import isGroupDue from './groupDueness'

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
      lastCompleted: `${MONDAY_DATE} 13:00`,
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
    // 22:00–06:00 boundaries → timesPerDay(1) fires at 02:00
    const boundaries = { start: time(22, 0), end: time(6, 0) }
    expect(isDue({
      recurrence: timesPerDay(1),
      lastCompleted: `${MONDAY_DATE} 23:00`,
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
