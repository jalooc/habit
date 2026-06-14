import { describe, expect, it } from 'vitest'
import { RRuleTemporal } from 'rrule-temporal'
import { Temporal } from '@js-temporal/polyfill'
import { buildRRule } from '../screens/EditSchedule/recurrence'
import formatCadence from './formatCadence'

const tzid = 'UTC'
const dtstart = Temporal.ZonedDateTime.from('2026-01-01T09:00:00[UTC]')

const dayBoundaries = {
  start: { hour: 7, minute: 0 },
  end: { hour: 23, minute: 0 },
}

describe('formatCadence', () => {
  it('formats once-a-day', () => {
    const rule = buildRRule({ type: 'every-x-days', value: 1 }, dayBoundaries)
    expect(formatCadence(rule)).toBe('Once a day')
  })

  it('formats every-N-days', () => {
    const rule = buildRRule({ type: 'every-x-days', value: 2 }, dayBoundaries)
    expect(formatCadence(rule)).toBe('Every 2 days')
  })

  it('formats every-3-days', () => {
    const rule = buildRRule({ type: 'every-x-days', value: 3 }, dayBoundaries)
    expect(formatCadence(rule)).toBe('Every 3 days')
  })

  it('formats times-per-day (multiple)', () => {
    const rule = buildRRule({ type: 'times-per-day', value: 3 }, dayBoundaries)
    expect(formatCadence(rule)).toBe('3× a day')
  })

  it('formats times-per-day (once)', () => {
    const rule = buildRRule({ type: 'times-per-day', value: 1 }, dayBoundaries)
    expect(formatCadence(rule)).toBe('Once a day')
  })

  it('formats every-x-hours', () => {
    const rule = buildRRule({ type: 'every-x-hours', value: 4 }, dayBoundaries)
    expect(formatCadence(rule)).toBe('Every 4 hours')
  })

  it('formats every-1-hour', () => {
    const rule = buildRRule({ type: 'every-x-hours', value: 1 }, dayBoundaries)
    expect(formatCadence(rule)).toBe('Every hour')
  })

  it('formats weekdays (Mon–Fri exactly)', () => {
    const rule = buildRRule(
      { type: 'times-per-week', value: 5, specificDays: ['MO', 'TU', 'WE', 'TH', 'FR'] },
      dayBoundaries,
    )
    expect(formatCadence(rule)).toBe('Weekdays')
  })

  it('formats once-a-week (1 specific day)', () => {
    const rule = buildRRule({ type: 'times-per-week', value: 1, specificDays: ['MO'] }, dayBoundaries)
    expect(formatCadence(rule)).toBe('Once a week')
  })

  it('formats N× a week (3 days)', () => {
    const rule = buildRRule({ type: 'times-per-week', value: 3 }, dayBoundaries)
    expect(formatCadence(rule)).toBe('3× a week')
  })

  it('formats once-a-month', () => {
    const rule = buildRRule({ type: 'times-per-month', value: 1 }, dayBoundaries)
    expect(formatCadence(rule)).toBe('Once a month')
  })

  it('falls back to rrule string for unknown freq', () => {
    const rule = new RRuleTemporal({
      freq: 'SECONDLY',
      interval: 30,
      dtstart,
      tzid,
    })
    const result = formatCadence(rule)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('formats minutely interval', () => {
    const rule = new RRuleTemporal({ freq: 'MINUTELY', interval: 30, dtstart, tzid })
    expect(formatCadence(rule)).toBe('Every 30 minutes')
  })
})
