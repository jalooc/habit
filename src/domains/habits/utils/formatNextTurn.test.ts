import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RRuleTemporal } from 'rrule-temporal'
import { Temporal } from '@js-temporal/polyfill'
import formatNextTurn from './formatNextTurn'

const tzid = Temporal.Now.timeZoneId()

const zdt = (iso: string) => Temporal.PlainDateTime.from(iso).toZonedDateTime(tzid)

describe('formatNextTurn', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-10T08:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats a same-day turn', () => {
    const rule = new RRuleTemporal({ freq: 'DAILY', dtstart: zdt('2026-06-01T18:30:00'), tzid })
    expect(formatNextTurn(rule)).toBe('today · 18:30')
  })

  it('formats a next-day turn', () => {
    const rule = new RRuleTemporal({ freq: 'DAILY', dtstart: zdt('2026-06-11T09:00:00'), tzid })
    expect(formatNextTurn(rule)).toBe('tomorrow · 9:00')
  })

  it('formats a turn later this week with its weekday', () => {
    const rule = new RRuleTemporal({ freq: 'WEEKLY', dtstart: zdt('2026-06-13T09:00:00'), tzid })
    expect(formatNextTurn(rule)).toBe('Sat · 9:00')
  })

  it('formats a turn a week or more away as a date', () => {
    const rule = new RRuleTemporal({ freq: 'MONTHLY', dtstart: zdt('2026-06-22T09:00:00'), tzid })
    expect(formatNextTurn(rule)).toBe('Jun 22')
  })

  it('returns undefined past the last occurrence of a finite rule', () => {
    const rule = new RRuleTemporal({ freq: 'DAILY', count: 2, dtstart: zdt('2026-01-01T09:00:00'), tzid })
    expect(formatNextTurn(rule)).toBeUndefined()
  })
})
