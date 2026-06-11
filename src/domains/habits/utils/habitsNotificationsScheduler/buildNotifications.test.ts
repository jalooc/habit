import { describe, expect, it } from 'vitest'
import { observable } from '@legendapp/state'
import { RRuleTemporal } from 'rrule-temporal'
import { Temporal } from '@js-temporal/polyfill'
import buildNotifications from './buildNotifications'

const TZ = 'Europe/Warsaw'

const dtstartDaysAgo = (days: number) => {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${String(d.getFullYear())}${pad(d.getMonth() + 1)}${pad(d.getDate())}T090000`
}

const makeRule = (daysAgo: number, rrule: string) =>
  new RRuleTemporal({ rruleString: `DTSTART;TZID=${TZ}:${dtstartDaysAgo(daysAgo)}\nRRULE:${rrule}` })

// Group fixtures pass through an observable so they have the exact type and
// shape buildNotifications receives in production (stores hand it `.get()` output).
const makeFixture = (groupCount: number, habitsPerGroup: number, daysAgo: number, rrule: string) => {
  const groupEntries = Array.from({ length: groupCount }, (_, g) => {
    const habitEntries = Array.from({ length: habitsPerGroup }, (_, h) => [
      `habit-${String(g)}-${String(h)}`,
      {
        name: `habit ${String(g)} ${String(h)}`,
        lastActioned: { timestamp: Date.now() - (habitsPerGroup - h) * 60_000, type: 'completed' as const },
      },
    ] as const)

    return {
      groupId: `group-${String(g)}`,
      group: {
        name: `group ${String(g)}`,
        habits: Object.fromEntries(habitEntries.map(([id]) => [id, true as const])),
        recurrence: makeRule(daysAgo, rrule),
      },
      habitEntries,
    }
  })

  const groups = observable(Object.fromEntries(groupEntries.map(e => [e.groupId, e.group]))).get()
  const habits = Object.fromEntries(groupEntries.flatMap(e => e.habitEntries))
  return { groups, habits }
}

// The straightforward (but slow) walk buildNotifications originally used,
// kept as a behavioral reference for the optimized implementation.
const referenceOccurrencesAfter = (rule: RRuleTemporal, after: Date, count: number) => {
  const occurrences: Temporal.ZonedDateTime[] = []
  for (let i = 0; i < count; i++) {
    const next = rule.next(occurrences.at(-1) ?? after, false)
    if (!next) break
    occurrences.push(next)
  }
  return occurrences
}

describe('buildNotifications', () => {
  const ruleCases: [string, number, string][] = [
    ['daily every 2 days', 30, 'FREQ=DAILY;INTERVAL=2'],
    ['3 times per day', 30, 'FREQ=DAILY;BYHOUR=9,14,19;BYMINUTE=0'],
    ['every 3 hours', 7, 'FREQ=HOURLY;INTERVAL=3'],
    ['weekly on specific days', 60, 'FREQ=WEEKLY;BYDAY=MO,TH'],
    ['biweekly', 60, 'FREQ=WEEKLY;INTERVAL=2;BYDAY=TU'],
    ['monthly on specific days', 90, 'FREQ=MONTHLY;BYMONTHDAY=1,15'],
  ]

  it.each(ruleCases)('matches the reference occurrence walk: %s', (_label, daysAgo, rrule) => {
    const habitCount = 5
    const { groups, habits } = makeFixture(1, habitCount, daysAgo, rrule)
    const expected = referenceOccurrencesAfter(makeRule(daysAgo, rrule), new Date(), habitCount)
      .map(o => o.epochMilliseconds)

    const cold = buildNotifications(groups, habits).map(n => n.date.getTime())
    const warm = buildNotifications(groups, habits).map(n => n.date.getTime())

    expect(cold).toEqual(expected)
    expect(warm).toEqual(expected)
  })

  it('produces nothing for a group with no habits', () => {
    const groups = observable({
      'group-empty': { name: 'empty', habits: {}, recurrence: makeRule(10, 'FREQ=DAILY') },
    }).get()
    expect(buildNotifications(groups, {})).toEqual([])
  })

  it('announces habits in queue order (least recently actioned first)', () => {
    const { groups, habits } = makeFixture(1, 3, 0, 'FREQ=DAILY;BYHOUR=9,14,19;BYMINUTE=0')

    const bodies = buildNotifications(groups, habits).map(n => n.body)

    expect(bodies).toHaveLength(3)
    expect(bodies[0]).toContain('habit 0 0')
    expect(bodies[1]).toContain('habit 0 1')
    expect(bodies[2]).toContain('habit 0 2')
  })

  it('caps at 64 notifications, soonest first', () => {
    const { groups, habits } = makeFixture(2, 40, 0, 'FREQ=HOURLY;INTERVAL=1')

    const dates = buildNotifications(groups, habits).map(n => n.date.getTime())

    expect(dates).toHaveLength(64)
    expect(dates).toEqual([...dates].sort((a, b) => a - b))
  })

  it('rebuilds quickly for many long-lived groups', () => {
    const { groups, habits } = makeFixture(8, 8, 180, 'FREQ=DAILY;BYHOUR=9,14,19;BYMINUTE=0')

    const t0 = performance.now()
    buildNotifications(groups, habits)
    const cold = performance.now() - t0

    const t1 = performance.now()
    buildNotifications(groups, habits)
    const warm = performance.now() - t1

    expect(cold).toBeLessThan(800)
    expect(warm).toBeLessThan(100)
  })
})
