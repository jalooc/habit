import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { observable } from '@legendapp/state'
import dayjs from 'dayjs'

import buildNotifications from './buildNotifications'

const time = (hour: number, minute: number) => ({ hour, minute })

const dayBoundaries = { start: time(8, 0), end: time(20, 0) }

const timesPerDay = (value: number) => ({ type: 'times-per-day', value } as const)

// Group fixtures pass through an observable so they have the exact type and
// shape buildNotifications receives in production (stores hand it `.get()` output).
const makeFixture = (groupCount: number, habitsPerGroup: number, dailyRate: number) => {
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
        recurrence: timesPerDay(dailyRate),
      },
      habitEntries,
    }
  })

  const groups = observable(Object.fromEntries(groupEntries.map(e => [e.groupId, e.group]))).get()
  const habits = Object.fromEntries(groupEntries.flatMap(e => e.habitEntries))
  return { groups, habits }
}

describe('buildNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-06T06:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('builds a notification with the group name, the next habit and a group deep link', () => {
    const { groups, habits } = makeFixture(1, 2, 1)

    const notifications = buildNotifications(groups, habits, dayBoundaries)

    expect(notifications[0]).toEqual({
      title: 'group 0',
      body: 'habit 0 0',
      date: dayjs('2026-07-06 14:00').toDate(),
      data: { url: 'group/group-0' },
    })
  })

  it('schedules the upcoming recurrence occurrences within the day boundaries', () => {
    const { groups, habits } = makeFixture(1, 1, 3)

    const dates = buildNotifications(groups, habits, dayBoundaries)
      .map(notification => dayjs(notification.date).format('YYYY-MM-DD HH:mm'))

    expect(dates).toHaveLength(64)
    expect(dates.slice(0, 6)).toEqual([
      '2026-07-06 10:00',
      '2026-07-06 14:00',
      '2026-07-06 18:00',
      '2026-07-07 10:00',
      '2026-07-07 14:00',
      '2026-07-07 18:00',
    ])
  })

  it('announces the least recently actioned habit in every notification', () => {
    const { groups, habits } = makeFixture(1, 3, 3)

    const bodies = buildNotifications(groups, habits, dayBoundaries).map(notification => notification.body)

    expect(new Set(bodies)).toEqual(new Set(['habit 0 0']))
  })

  it('prefers a never-actioned habit as the next in queue', () => {
    const groups = observable({
      'group-0': {
        name: 'group 0',
        habits: { 'habit-actioned': true as const, 'habit-fresh': true as const },
        recurrence: timesPerDay(1),
      },
    }).get()
    const habits = {
      'habit-actioned': { name: 'actioned', lastActioned: { timestamp: Date.now(), type: 'completed' as const }},
      'habit-fresh': { name: 'fresh' },
    }

    expect(buildNotifications(groups, habits, dayBoundaries)[0].body).toBe('fresh')
  })

  it('does not announce a turn already served ahead of its due moment', () => {
    // timesPerDay(3) → turn 2 opens 12:00, comes due 14:00; completed 13:00 serves it,
    // so the next reminder is turn 3 at 18:00 rather than a ping for what is already done
    vi.setSystemTime(new Date('2026-07-06T13:30:00'))
    const groups = observable({
      'group-0': {
        name: 'group 0',
        habits: { 'habit-0': true as const },
        recurrence: timesPerDay(3),
      },
    }).get()
    const habits = {
      'habit-0': {
        name: 'habit 0',
        lastActioned: { timestamp: dayjs('2026-07-06 13:00').valueOf(), type: 'completed' as const },
      },
    }

    const [first] = buildNotifications(groups, habits, dayBoundaries)

    expect(dayjs(first.date).format('YYYY-MM-DD HH:mm')).toBe('2026-07-06 18:00')
  })

  it('keeps the rest of the day scheduled when a turn is skipped seconds after it came due', () => {
    // The scheduler rebuilds on every action, so a skip taken straight from the 14:00 notification
    // rebuilds at 14:00:30 with the turn still unserved. Today's 18:00 reminder has to survive that.
    vi.setSystemTime(new Date('2026-07-06T14:00:30'))
    const groups = observable({
      'group-0': {
        name: 'group 0',
        habits: { 'habit-0': true as const },
        recurrence: timesPerDay(3),
      },
    }).get()
    const habits = {
      'habit-0': {
        name: 'habit 0',
        lastActioned: { timestamp: dayjs('2026-07-06 14:00:30').valueOf(), type: 'skipped' as const },
      },
    }

    const [first] = buildNotifications(groups, habits, dayBoundaries)

    expect(dayjs(first.date).format('YYYY-MM-DD HH:mm')).toBe('2026-07-06 18:00')
  })

  it('skips groups without a recurrence', () => {
    const groups = observable({
      'group-0': { name: 'group 0', habits: { 'habit-0': true as const }},
    }).get()

    expect(buildNotifications(groups, { 'habit-0': { name: 'habit 0' }}, dayBoundaries)).toEqual([])
  })

  it('produces nothing for a group with no habits', () => {
    const groups = observable({
      'group-empty': { name: 'empty', habits: {}, recurrence: timesPerDay(1) },
    }).get()

    expect(buildNotifications(groups, {}, dayBoundaries)).toEqual([])
  })

  it('interleaves groups by occurrence time', () => {
    const groups = observable({
      'group-once': {
        name: 'once daily',
        habits: { 'habit-once': true as const },
        recurrence: timesPerDay(1),
      },
      'group-twice': {
        name: 'twice daily',
        habits: { 'habit-twice': true as const },
        recurrence: timesPerDay(2),
      },
    }).get()
    const habits = { 'habit-once': { name: 'once' }, 'habit-twice': { name: 'twice' }}

    const titles = buildNotifications(groups, habits, dayBoundaries).map(notification => notification.title)

    expect(titles.slice(0, 3)).toEqual(['twice daily', 'once daily', 'twice daily'])
  })

  it('caps at 64 notifications, soonest first', () => {
    const { groups, habits } = makeFixture(2, 1, 3)

    const notifications = buildNotifications(groups, habits, dayBoundaries)
    const dates = notifications.map(notification => notification.date.getTime())

    expect(dates).toHaveLength(64)
    expect(dates).toEqual([...dates].sort((a, b) => a - b))
    expect(new Set(notifications.map(notification => notification.title))).toEqual(new Set(['group 0', 'group 1']))
  })
})
