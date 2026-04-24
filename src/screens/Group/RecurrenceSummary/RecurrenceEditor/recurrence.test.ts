import { describe, expect, it } from 'vitest'
import {
  distributeWeekdays,
  distributeMonthDays,
  buildRRule,
  parseRRule,
} from './recurrence'
import type { RecurrenceConfig } from './recurrence'

const dayBoundaries = {
  start: { hour: 7, minute: 0 },
  end: { hour: 23, minute: 0 },
}

describe('distributeWeekdays', () => {
  it('returns all 7 days when count >= 7', () => {
    expect(distributeWeekdays(7)).toEqual(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])
    expect(distributeWeekdays(10)).toEqual(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])
  })

  it('distributes days evenly for count < 7', () => {
    const result3 = distributeWeekdays(3)
    expect(result3).toHaveLength(3)
    expect(new Set(result3).size).toBe(3)
  })

  it('returns 1 day for count = 1', () => {
    expect(distributeWeekdays(1)).toHaveLength(1)
  })

  it('returns 2 spaced days for count = 2', () => {
    const result = distributeWeekdays(2)
    expect(result).toHaveLength(2)
    expect(result[0]).not.toBe(result[1])
  })
})

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

describe('buildRRule', () => {
  it('builds times-per-day with DAILY freq and byHour', () => {
    const config: RecurrenceConfig = { type: 'times-per-day', value: 3 }
    const rule = buildRRule(config, dayBoundaries)
    const opts = rule.options()
    expect(opts.freq).toBe('DAILY')
    expect(opts.byHour).toHaveLength(3)
    expect(opts.byMinute).toEqual([0])
  })

  it('deduplicates byHour when slots collide on rounding', () => {
    const tightBoundaries = {
      start: { hour: 10, minute: 0 },
      end: { hour: 12, minute: 0 },
    }
    const config: RecurrenceConfig = { type: 'times-per-day', value: 4 }
    const rule = buildRRule(config, tightBoundaries)
    const opts = rule.options()
    expect(opts.byHour).toEqual([...new Set(opts.byHour)])
    expect(opts.byHour).toEqual([...(opts.byHour ?? [])].sort((a, b) => a - b))
  })

  it('builds every-x-hours with HOURLY freq and interval', () => {
    const config: RecurrenceConfig = { type: 'every-x-hours', value: 4 }
    const rule = buildRRule(config, dayBoundaries)
    const opts = rule.options()
    expect(opts.freq).toBe('HOURLY')
    expect(opts.interval).toBe(4)
  })

  it('builds every-x-days with DAILY freq and interval', () => {
    const config: RecurrenceConfig = { type: 'every-x-days', value: 3 }
    const rule = buildRRule(config, dayBoundaries)
    const opts = rule.options()
    expect(opts.freq).toBe('DAILY')
    expect(opts.interval).toBe(3)
  })

  it('builds times-per-week with WEEKLY freq and byDay', () => {
    const config: RecurrenceConfig = { type: 'times-per-week', value: 3 }
    const rule = buildRRule(config, dayBoundaries)
    const opts = rule.options()
    expect(opts.freq).toBe('WEEKLY')
    expect(opts.byDay).toHaveLength(3)
  })

  it('builds times-per-week with specific days', () => {
    const config: RecurrenceConfig = {
      type: 'times-per-week',
      value: 2,
      specificDays: ['MO', 'FR'],
    }
    const rule = buildRRule(config, dayBoundaries)
    const opts = rule.options()
    expect(opts.freq).toBe('WEEKLY')
    expect(opts.byDay).toEqual(['MO', 'FR'])
  })

  it('builds times-per-month with MONTHLY freq and byMonthDay', () => {
    const config: RecurrenceConfig = { type: 'times-per-month', value: 5 }
    const rule = buildRRule(config, dayBoundaries)
    const opts = rule.options()
    expect(opts.freq).toBe('MONTHLY')
    expect(opts.byMonthDay).toHaveLength(5)
  })

  it('applies restrictDays as byDay', () => {
    const config: RecurrenceConfig = {
      type: 'every-x-hours',
      value: 2,
      restrictDays: ['MO', 'WE', 'FR'],
    }
    const rule = buildRRule(config, dayBoundaries)
    const opts = rule.options()
    expect(opts.byDay).toEqual(['MO', 'WE', 'FR'])
  })
})

describe('parseRRule', () => {
  it('parses HOURLY with byHour as times-per-day', () => {
    const config: RecurrenceConfig = { type: 'times-per-day', value: 3 }
    const rule = buildRRule(config, dayBoundaries)
    const parsed = parseRRule(rule.toString())
    expect(parsed.type).toBe('times-per-day')
    expect(parsed.value).toBe(3)
  })

  it('parses HOURLY without byHour as every-x-hours', () => {
    const config: RecurrenceConfig = { type: 'every-x-hours', value: 4 }
    const rule = buildRRule(config, dayBoundaries)
    const parsed = parseRRule(rule.toString())
    expect(parsed.type).toBe('every-x-hours')
    expect(parsed.value).toBe(4)
  })

  it('parses DAILY as every-x-days', () => {
    const config: RecurrenceConfig = { type: 'every-x-days', value: 3 }
    const rule = buildRRule(config, dayBoundaries)
    const parsed = parseRRule(rule.toString())
    expect(parsed.type).toBe('every-x-days')
    expect(parsed.value).toBe(3)
  })

  it('parses WEEKLY as times-per-week with specificDays', () => {
    const config: RecurrenceConfig = {
      type: 'times-per-week',
      value: 2,
      specificDays: ['MO', 'FR'],
    }
    const rule = buildRRule(config, dayBoundaries)
    const parsed = parseRRule(rule.toString())
    expect(parsed.type).toBe('times-per-week')
    expect(parsed.value).toBe(2)
    expect(parsed.specificDays).toEqual(['MO', 'FR'])
  })

  it('parses MONTHLY as times-per-month', () => {
    const config: RecurrenceConfig = { type: 'times-per-month', value: 5 }
    const rule = buildRRule(config, dayBoundaries)
    const parsed = parseRRule(rule.toString())
    expect(parsed.type).toBe('times-per-month')
    expect(parsed.value).toBe(5)
  })

  it('preserves restrictDays through round-trip', () => {
    const config: RecurrenceConfig = {
      type: 'every-x-hours',
      value: 2,
      restrictDays: ['MO', 'WE', 'FR'],
    }
    const rule = buildRRule(config, dayBoundaries)
    const parsed = parseRRule(rule.toString())
    expect(parsed.restrictDays).toEqual(['MO', 'WE', 'FR'])
  })

  it('falls back to every-x-days for unknown freq', () => {
    const result = parseRRule('DTSTART:20260304T070000Z\nRRULE:FREQ=SECONDLY;INTERVAL=30')
    expect(result).toEqual({ type: 'every-x-days', value: 1 })
  })
})
