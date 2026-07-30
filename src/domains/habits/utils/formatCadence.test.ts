import { describe, expect, it } from 'vitest'
import { objectFromEntries } from 'tsafe'
import { Weekday, WEEKDAYS } from 'src/domains/recurrence/utils/recurrence'
import formatCadence from './formatCadence'

const days = (...selected: Weekday[]) =>
  objectFromEntries(WEEKDAYS.map(day => [day, selected.includes(day)]))

describe('formatCadence', () => {
  it('formats once a day', () => {
    expect(formatCadence({ type: 'times-per-day', value: 1 })).toBe('Once a day')
  })

  it('formats several times a day', () => {
    expect(formatCadence({ type: 'times-per-day', value: 3 })).toBe('3× a day')
  })

  it('formats every hour', () => {
    expect(formatCadence({ type: 'every-x-hours', value: 1 })).toBe('Every hour')
  })

  it('formats every N hours', () => {
    expect(formatCadence({ type: 'every-x-hours', value: 4 })).toBe('Every 4 hours')
  })

  it('formats a one-day interval as once a day', () => {
    expect(formatCadence({ type: 'every-x-days', value: 1 })).toBe('Once a day')
  })

  it('formats every N days', () => {
    expect(formatCadence({ type: 'every-x-days', value: 2 })).toBe('Every 2 days')
  })

  it('formats once a week', () => {
    expect(formatCadence({ type: 'times-per-week', value: 1 })).toBe('Once a week')
  })

  it('formats several times a week', () => {
    expect(formatCadence({ type: 'times-per-week', value: 3 })).toBe('3× a week')
  })

  it('formats exactly Mon–Fri as weekdays', () => {
    expect(formatCadence({ type: 'times-per-week', value: 5, specificDays: days('mo', 'tu', 'we', 'th', 'fr') }))
      .toBe('Weekdays')
  })

  it('does not label five days including a weekend day as weekdays', () => {
    expect(formatCadence({ type: 'times-per-week', value: 5, specificDays: days('mo', 'tu', 'we', 'th', 'sa') }))
      .toBe('5× a week')
  })

  it('formats a single specific day as once a week', () => {
    expect(formatCadence({ type: 'times-per-week', value: 1, specificDays: days('mo') })).toBe('Once a week')
  })

  it('counts selected days over the stored value', () => {
    expect(formatCadence({ type: 'times-per-week', value: 1, specificDays: days('mo', 'we', 'fr') }))
      .toBe('3× a week')
  })

  it('formats once a month', () => {
    expect(formatCadence({ type: 'times-per-month', value: 1 })).toBe('Once a month')
  })

  it('formats several times a month', () => {
    expect(formatCadence({ type: 'times-per-month', value: 3 })).toBe('3× a month')
  })
})
