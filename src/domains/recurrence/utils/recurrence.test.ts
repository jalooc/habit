import { describe, expect, it } from 'vitest'

import { distributeMonthDays, parseRRule } from './recurrence'

const rrule = (rule: string) => `DTSTART:20260304T070000Z\nRRULE:${rule}`

describe('distributeMonthDays', () => {
  it('returns days 1-28 when count >= 28', () => {
    const result = distributeMonthDays(28)
    expect(result).toHaveLength(28)
    expect(result[0]).toBe(1)
    expect(result[27]).toBe(28)
  })

  it('returns 1 day for count = 1', () => {
    expect(distributeMonthDays(1)).toEqual([1])
  })

  it('distributes days evenly', () => {
    const result = distributeMonthDays(4)
    expect(result).toHaveLength(4)
    result.forEach(day => {
      expect(day).toBeGreaterThanOrEqual(1)
      expect(day).toBeLessThanOrEqual(28)
    })
    // days should be in ascending order
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1])
    }
  })
})

describe('parseRRule', () => {
  it('parses DAILY with byHour as times-per-day', () => {
    expect(parseRRule(rrule('FREQ=DAILY;BYHOUR=9,13,17;BYMINUTE=0'))).toEqual({
      type: 'times-per-day',
      value: 3,
    })
  })

  it('parses HOURLY as every-x-hours', () => {
    expect(parseRRule(rrule('FREQ=HOURLY;INTERVAL=4'))).toEqual({
      type: 'every-x-hours',
      value: 4,
    })
  })

  it('parses DAILY without byHour as every-x-days', () => {
    expect(parseRRule(rrule('FREQ=DAILY;INTERVAL=3'))).toEqual({
      type: 'every-x-days',
      value: 3,
    })
  })

  it('parses WEEKLY as times-per-week with specificDays', () => {
    expect(parseRRule(rrule('FREQ=WEEKLY;BYDAY=MO,FR'))).toEqual({
      type: 'times-per-week',
      value: 2,
      specificDays: { mo: true, tu: false, we: false, th: false, fr: true, sa: false, su: false },
    })
  })

  it('parses MONTHLY as times-per-month', () => {
    expect(parseRRule(rrule('FREQ=MONTHLY;BYMONTHDAY=1,7,13,19,25'))).toEqual({
      type: 'times-per-month',
      value: 5,
    })
  })

  it('falls back to every-x-days for unknown freq', () => {
    expect(parseRRule(rrule('FREQ=SECONDLY;INTERVAL=30'))).toEqual({
      type: 'every-x-days',
      value: 1,
    })
  })
})
