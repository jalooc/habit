import { describe, expect, it } from 'vitest'
import { RRuleTemporal } from 'rrule-temporal'
import { Temporal } from '@js-temporal/polyfill'
import isGroupDue from './groupDueness'

const tzid = 'UTC'

const makeZDT = (isoString: string) =>
  Temporal.ZonedDateTime.from(`${isoString}[${tzid}]`)

const dailyRule = new RRuleTemporal({
  freq: 'DAILY',
  interval: 1,
  dtstart: makeZDT('2026-01-01T09:00:00'),
  tzid,
})

const everyTwoDaysRule = new RRuleTemporal({
  freq: 'DAILY',
  interval: 2,
  dtstart: makeZDT('2026-01-01T09:00:00'),
  tzid,
})

const weekdayRule = new RRuleTemporal({
  freq: 'WEEKLY',
  byDay: ['MO', 'TU', 'WE', 'TH', 'FR'],
  dtstart: makeZDT('2026-01-05T09:00:00'),
  tzid,
})

describe('isGroupDue', () => {
  it('returns false when recurrence is undefined', () => {
    expect(isGroupDue({
      recurrence: undefined,
      upNextLastActioned: undefined,
      now: new Date('2026-06-10T10:00:00Z'),
    })).toBe(false)
  })

  it('returns true when up-next was never actioned and a past occurrence exists', () => {
    expect(isGroupDue({
      recurrence: dailyRule,
      upNextLastActioned: undefined,
      now: new Date('2026-06-10T10:00:00Z'),
    })).toBe(true)
  })

  it('returns false when now is before dtstart (no past occurrence)', () => {
    const earlyRule = new RRuleTemporal({
      freq: 'DAILY',
      interval: 1,
      dtstart: makeZDT('2030-01-01T09:00:00'),
      tzid,
    })
    expect(isGroupDue({
      recurrence: earlyRule,
      upNextLastActioned: undefined,
      now: new Date('2026-01-01T08:00:00Z'),
    })).toBe(false)
  })

  it('returns true when actioned before the most recent occurrence', () => {
    // Daily rule, dtstart 2026-01-01 09:00 UTC
    // now = 2026-06-10 10:00 → last occurrence was 2026-06-10 09:00
    // actioned at 2026-06-09 10:00, which is before 2026-06-10 09:00
    const actionedAt = new Date('2026-06-09T10:00:00Z').getTime()
    expect(isGroupDue({
      recurrence: dailyRule,
      upNextLastActioned: actionedAt,
      now: new Date('2026-06-10T10:00:00Z'),
    })).toBe(true)
  })

  it('returns false when actioned after the most recent occurrence', () => {
    // now = 2026-06-10 10:00 → last occurrence was 2026-06-10 09:00
    // actioned at 2026-06-10 09:30, which is after
    const actionedAt = new Date('2026-06-10T09:30:00Z').getTime()
    expect(isGroupDue({
      recurrence: dailyRule,
      upNextLastActioned: actionedAt,
      now: new Date('2026-06-10T10:00:00Z'),
    })).toBe(false)
  })

  it('handles every-2-days rule correctly', () => {
    // dtstart 2026-01-01 → occurrences Jan 1, Jan 3, Jan 5 …
    // now = 2026-01-04 10:00 → last occurrence was 2026-01-03 09:00
    const actionedAt = new Date('2026-01-02T10:00:00Z').getTime()
    expect(isGroupDue({
      recurrence: everyTwoDaysRule,
      upNextLastActioned: actionedAt,
      now: new Date('2026-01-04T10:00:00Z'),
    })).toBe(true)
  })

  it('returns false on every-2-days when already actioned today', () => {
    // last occurrence was 2026-01-03 09:00, actioned at 2026-01-03 10:00 (after)
    const actionedAt = new Date('2026-01-03T10:00:00Z').getTime()
    expect(isGroupDue({
      recurrence: everyTwoDaysRule,
      upNextLastActioned: actionedAt,
      now: new Date('2026-01-04T10:00:00Z'),
    })).toBe(false)
  })

  it('handles weekday rule — due on a weekday', () => {
    // 2026-06-10 is a Wednesday → weekday rule fires
    expect(isGroupDue({
      recurrence: weekdayRule,
      upNextLastActioned: undefined,
      now: new Date('2026-06-10T10:00:00Z'),
    })).toBe(true)
  })

  it('handles weekday rule — not yet due on a weekend', () => {
    // 2026-06-13 is Saturday → no weekday occurrence today, last was Friday 2026-06-12
    // actioned on Friday after occurrence
    const actionedAt = new Date('2026-06-12T10:00:00Z').getTime()
    expect(isGroupDue({
      recurrence: weekdayRule,
      upNextLastActioned: actionedAt,
      now: new Date('2026-06-13T10:00:00Z'),
    })).toBe(false)
  })
})
