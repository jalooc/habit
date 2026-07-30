import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import formatNextTurn from './formatNextTurn'

const MONDAY_DATE = '2026-07-06'

const time = (hour: number, minute: number) => ({ hour, minute })

const dayBoundaries = { start: time(8, 0), end: time(20, 0) }

const timesPerDay = (value: number, specificDays?: Parameters<typeof formatNextTurn>[0]['specificDays']) =>
  ({ type: 'times-per-day', value, specificDays } as const)

describe('formatNextTurn', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats a same-day turn', () => {
    vi.setSystemTime(new Date(`${MONDAY_DATE}T06:00:00`))
    expect(formatNextTurn(timesPerDay(1), dayBoundaries)).toBe('today · 14:00')
  })

  it('formats hours without a leading zero', () => {
    vi.setSystemTime(new Date(`${MONDAY_DATE}T06:00:00`))
    const boundaries = { start: time(9, 0), end: time(20, 0) }
    expect(formatNextTurn(timesPerDay(3), boundaries)).toBe('today · 9:00')
  })

  it('formats a next-day turn', () => {
    vi.setSystemTime(new Date(`${MONDAY_DATE}T15:00:00`))
    expect(formatNextTurn(timesPerDay(1), dayBoundaries)).toBe('tomorrow · 14:00')
  })

  it('formats a turn later this week with its weekday', () => {
    vi.setSystemTime(new Date(`${MONDAY_DATE}T15:00:00`))
    const thursdayOnly = timesPerDay(1, { mo: false, tu: false, we: false, th: true, fr: false, sa: false, su: false })
    expect(formatNextTurn(thursdayOnly, dayBoundaries)).toBe('Thu · 14:00')
  })

  it('formats a turn a week away as a date', () => {
    vi.setSystemTime(new Date(`${MONDAY_DATE}T15:00:00`))
    const mondayOnly = timesPerDay(1, { mo: true, tu: false, we: false, th: false, fr: false, sa: false, su: false })
    expect(formatNextTurn(mondayOnly, dayBoundaries)).toBe('Jul 13')
  })
})
