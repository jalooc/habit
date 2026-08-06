import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'
import formatNextTurn from './formatNextTurn'

const MONDAY_DATE = '2026-07-06'

const time = (hour: number, minute: number) => ({ hour, minute })

const dayBoundaries = { start: time(8, 0), end: time(20, 0) }

const timesPerDay = (value: number, specificDays?: Parameters<typeof formatNextTurn>[0]['specificDays']) =>
  ({ type: 'times-per-day', value, specificDays } as const)

const NEVER_SERVED = null

describe('formatNextTurn', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats a same-day turn', () => {
    vi.setSystemTime(new Date(`${MONDAY_DATE}T06:00:00`))
    expect(formatNextTurn(timesPerDay(1), NEVER_SERVED, dayBoundaries)).toBe('today · 14:00')
  })

  it('looks past a turn already served ahead of its due moment', () => {
    // the single daily turn spans 08:00–20:00 and came due 14:00; completing at 09:00 serves it,
    // so the next turn to announce is tomorrow's — not the one already done
    vi.setSystemTime(new Date(`${MONDAY_DATE}T10:00:00`))
    const completedEarly = dayjs(`${MONDAY_DATE} 09:00`).valueOf()
    expect(formatNextTurn(timesPerDay(1), completedEarly, dayBoundaries)).toBe('tomorrow · 14:00')
  })

  it('formats hours without a leading zero', () => {
    vi.setSystemTime(new Date(`${MONDAY_DATE}T05:00:00`))
    // 06:00–12:00 split into 3 slots → 07:00/09:00/11:00
    const boundaries = { start: time(6, 0), end: time(12, 0) }
    expect(formatNextTurn(timesPerDay(3), NEVER_SERVED, boundaries)).toBe('today · 7:00')
  })

  it('formats a next-day turn', () => {
    vi.setSystemTime(new Date(`${MONDAY_DATE}T15:00:00`))
    expect(formatNextTurn(timesPerDay(1), NEVER_SERVED, dayBoundaries)).toBe('tomorrow · 14:00')
  })

  it('formats a turn later this week with its weekday', () => {
    vi.setSystemTime(new Date(`${MONDAY_DATE}T15:00:00`))
    const thursdayOnly = timesPerDay(1, { mo: false, tu: false, we: false, th: true, fr: false, sa: false, su: false })
    expect(formatNextTurn(thursdayOnly, NEVER_SERVED, dayBoundaries)).toBe('Thu · 14:00')
  })

  it('formats a turn a week away as a date', () => {
    vi.setSystemTime(new Date(`${MONDAY_DATE}T15:00:00`))
    const mondayOnly = timesPerDay(1, { mo: true, tu: false, we: false, th: false, fr: false, sa: false, su: false })
    expect(formatNextTurn(mondayOnly, NEVER_SERVED, dayBoundaries)).toBe('Jul 13')
  })
})
