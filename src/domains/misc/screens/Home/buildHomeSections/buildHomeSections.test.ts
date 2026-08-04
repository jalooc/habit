import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import type { HabitsStores } from 'src/domains/habits/stores/habits'
import buildHomeSections from './buildHomeSections'

const MONDAY_DATE = '2026-07-06'

const time = (hour: number, minute: number) => ({ hour, minute })

// 08:00–20:00 boundaries: timesPerDay(1) fires at 14:00,
// timesPerDay(3) at 10:00/14:00/18:00, timesPerDay(4) at 09:30/12:30/15:30/18:30
const dayBoundaries = { start: time(8, 0), end: time(20, 0) }

const timesPerDay = (value: number) => ({ type: 'times-per-day', value } as const)

// completed before all of today's occurrences → "behind", with a real history
const COMPLETED_YESTERDAY = dayjs('2026-07-05 15:00').valueOf()
// completed after today's 14:00 occurrence → not behind for timesPerDay(1) and timesPerDay(3)
const COMPLETED_AFTER_TODAYS_OCCURRENCE = dayjs(`${MONDAY_DATE} 14:30`).valueOf()

type GroupsInput = Parameters<typeof buildHomeSections>[0]['groups']

const makeGroups = (entries: [string, Omit<NonNullable<GroupsInput[string]>, 'name'>][]): GroupsInput =>
  Object.fromEntries(entries.map(([id, group]) => [id, { name: `Group ${id}`, ...group }]))

const makeHabits = (entries: [string, { timestamp?: number, type?: 'completed' | 'skipped' }][]): HabitsStores =>
  Object.fromEntries(entries.map(([id, opts]) => [id, {
    name: `Habit ${id}`,
    ...(opts.timestamp !== undefined && {
      lastActioned: { timestamp: opts.timestamp, type: opts.type ?? 'completed' },
    }),
  }]))

const build = (groups: GroupsInput, habits: HabitsStores, now: string) =>
  buildHomeSections({ groups, habits, dayBoundaries, now: dayjs(now) })

describe('buildHomeSections', () => {
  it('places a group with no habits into other', () => {
    const groups = makeGroups([['g1', { habits: {}, recurrence: timesPerDay(1) }]])
    const result = build(groups, makeHabits([]), `${MONDAY_DATE} 17:00`)
    expect(result.otherGroupIds).toContain('g1')
    expect(result.carried).toHaveLength(0)
    expect(result.upNext).toHaveLength(0)
  })

  it('places a group with no recurrence into other', () => {
    const groups = makeGroups([['g1', { habits: { h1: true }}]])
    const habits = makeHabits([['h1', {}]])
    const result = build(groups, habits, `${MONDAY_DATE} 17:00`)
    expect(result.otherGroupIds).toContain('g1')
  })

  it('skips undefined group entries', () => {
    const groups: GroupsInput = { g1: undefined }
    const result = build(groups, makeHabits([]), `${MONDAY_DATE} 17:00`)
    expect(result).toEqual({ carried: [], upNext: [], otherGroupIds: [] })
  })

  it('places into carried when the last completed tick is older than the last occurrence (> 15 min behind)', () => {
    // occurrence 14:00; now 17:00 → elapsed 3h (> 15 min); completed yesterday → behind, with a real history
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: timesPerDay(1) }]])
    const habits = makeHabits([['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }]])
    const result = build(groups, habits, `${MONDAY_DATE} 17:00`)
    expect(result.carried).toHaveLength(1)
    expect(result.carried[0].groupId).toBe('g1')
    expect(result.carried[0].dueSinceMs).toBe(3 * 60 * 60 * 1000)
    expect(result.upNext).toHaveLength(0)
    expect(result.otherGroupIds).not.toContain('g1')
  })

  it('places a completed rotation that fell behind ≤ 15 min into upNext (now kind)', () => {
    // last occurrence 15:30 (10 min ago); completed yesterday → behind within the NOW window
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: timesPerDay(4) }]])
    const habits = makeHabits([['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }]])
    const result = build(groups, habits, `${MONDAY_DATE} 15:40`)
    expect(result.upNext).toHaveLength(1)
    expect(result.upNext[0].kind).toBe('now')
    expect(result.carried).toHaveLength(0)
  })

  it('places a completed rotation behind by exactly 15 min into upNext (now kind)', () => {
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: timesPerDay(4) }]])
    const habits = makeHabits([['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }]])
    const result = build(groups, habits, `${MONDAY_DATE} 15:45`)
    expect(result.upNext).toHaveLength(1)
    expect(result.upNext[0].kind).toBe('now')
  })

  it('places a completed rotation behind by more than 15 min into carried', () => {
    // last occurrence 15:30 (16 min ago) → past the NOW window
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: timesPerDay(4) }]])
    const habits = makeHabits([['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }]])
    const result = build(groups, habits, `${MONDAY_DATE} 15:46`)
    expect(result.carried).toHaveLength(1)
    expect(result.upNext).toHaveLength(0)
  })

  it('surfaces a never-completed rotation in upNext (now), never in carried — even when long overdue', () => {
    // occurrence 14:00, now 17:00 → 3h "behind", but the habit has never been completed.
    // A brand-new rotation has no history to carry over → it belongs at the top of Up next.
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: timesPerDay(1) }]])
    const habits = makeHabits([['h1', {}]])
    const result = build(groups, habits, `${MONDAY_DATE} 17:00`)
    expect(result.carried).toHaveLength(0)
    expect(result.upNext).toHaveLength(1)
    expect(result.upNext[0].kind).toBe('now')
    expect(result.upNext[0].groupId).toBe('g1')
  })

  it('sorts never-actioned rotations ahead of completed "now" rows in upNext', () => {
    // g_new: never actioned, 1h40m behind → new "now"
    // g_recent: completed history, fell behind 10 min → "now"
    const groups = makeGroups([
      ['g_recent', { habits: { h_r: true }, recurrence: timesPerDay(4) }],
      ['g_new', { habits: { h_n: true }, recurrence: timesPerDay(1) }],
    ])
    const habits = makeHabits([
      ['h_r', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }],
      ['h_n', {}],
    ])
    const result = build(groups, habits, `${MONDAY_DATE} 15:40`)
    expect(result.upNext.map(r => r.groupId)).toEqual(['g_new', 'g_recent'])
  })

  it('carries a skip-only rotation — a skip is history, so it is not new', () => {
    // only ever skipped → still behind (skip ≠ complete), but it has history → carried, not a "now" pin
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: timesPerDay(1) }]])
    const habits = makeHabits([['h1', { timestamp: dayjs(`${MONDAY_DATE} 15:00`).valueOf(), type: 'skipped' }]])
    const result = build(groups, habits, `${MONDAY_DATE} 17:00`)
    expect(result.carried).toHaveLength(1)
    expect(result.carried[0].dueSinceMs).toBe(3 * 60 * 60 * 1000)
    expect(result.upNext).toHaveLength(0)
  })

  it('keeps a rotation new when only some of its habits were skipped', () => {
    // h2 skipped, h1 never actioned → the rotation has history → carried
    const groups = makeGroups([['g1', { habits: { h1: true, h2: true }, recurrence: timesPerDay(1) }]])
    const habits = makeHabits([
      ['h1', {}],
      ['h2', { timestamp: dayjs(`${MONDAY_DATE} 15:00`).valueOf(), type: 'skipped' }],
    ])
    const result = build(groups, habits, `${MONDAY_DATE} 17:00`)
    expect(result.carried).toHaveLength(1)
    expect(result.upNext).toHaveLength(0)
  })

  it('keeps a rotation carried when its up-next was skipped but it has an older completion (skip ≠ complete)', () => {
    // h1 completed yesterday (the real history); h2 only skipped today → lastCompleted = yesterday < 14:00
    const groups = makeGroups([['g1', { habits: { h1: true, h2: true }, recurrence: timesPerDay(1) }]])
    const habits = makeHabits([
      ['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }],
      ['h2', { timestamp: dayjs(`${MONDAY_DATE} 16:30`).valueOf(), type: 'skipped' }],
    ])
    const result = build(groups, habits, `${MONDAY_DATE} 17:00`)
    expect(result.carried).toHaveLength(1)
  })

  it('places into upcoming when not behind and next occurrence is within today window', () => {
    // completed after the 14:00 occurrence → not behind; next occurrence 18:00 today
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: timesPerDay(3) }]])
    const habits = makeHabits([['h1', { timestamp: COMPLETED_AFTER_TODAYS_OCCURRENCE, type: 'completed' }]])
    const result = build(groups, habits, `${MONDAY_DATE} 15:00`)
    expect(result.upNext).toHaveLength(1)
    expect(result.upNext[0].kind).toBe('upcoming')
    if (result.upNext[0].kind === 'upcoming') {
      expect(result.upNext[0].dueAtMs).toBe(dayjs(`${MONDAY_DATE} 18:00`).valueOf())
    }
  })

  it('announces the following turn when the current one was served ahead of its due moment', () => {
    // timesPerDay(3) → turn 2 opens 12:00, comes due 14:00; completed 13:00 serves it,
    // so what is upcoming is turn 3 at 18:00 — not the 14:00 turn already done
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: timesPerDay(3) }]])
    const habits = makeHabits([['h1', { timestamp: dayjs(`${MONDAY_DATE} 13:00`).valueOf(), type: 'completed' }]])
    const result = build(groups, habits, `${MONDAY_DATE} 13:30`)
    expect(result.carried).toHaveLength(0)
    expect(result.upNext).toHaveLength(1)
    expect(result.upNext[0].kind).toBe('upcoming')
    if (result.upNext[0].kind === 'upcoming') {
      expect(result.upNext[0].dueAtMs).toBe(dayjs(`${MONDAY_DATE} 18:00`).valueOf())
    }
  })

  it('places into other when not behind and next occurrence is beyond today window', () => {
    // completed after the 14:00 occurrence → not behind; next occurrence tomorrow 14:00 → beyond today
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: timesPerDay(1) }]])
    const habits = makeHabits([['h1', { timestamp: COMPLETED_AFTER_TODAYS_OCCURRENCE, type: 'completed' }]])
    const result = build(groups, habits, `${MONDAY_DATE} 15:00`)
    expect(result.otherGroupIds).toContain('g1')
    expect(result.carried).toHaveLength(0)
    expect(result.upNext).toHaveLength(0)
  })

  it('sorts carried oldest-first (dueSinceMs descending)', () => {
    // g1 behind 3h (occurrence 14:00), g2 behind 1h (occurrence 16:00) — both with a real completion history
    const groups = makeGroups([
      ['g1', { habits: { h1: true }, recurrence: timesPerDay(1) }],
      ['g2', { habits: { h2: true }, recurrence: timesPerDay(4) }],
    ])
    const habits = makeHabits([
      ['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }],
      ['h2', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }],
    ])
    const result = build(groups, habits, `${MONDAY_DATE} 17:00`)
    expect(result.carried).toHaveLength(2)
    expect(result.carried[0].groupId).toBe('g1')
    expect(result.carried[1].groupId).toBe('g2')
  })

  it('sorts upNext: now rows before upcoming rows', () => {
    // now row: never-completed, behind → new "now"; upcoming row: not behind, next occurrence 20:00
    const groups = makeGroups([
      ['g_upcoming', { habits: { h_u: true }, recurrence: timesPerDay(3) }],
      ['g_now', { habits: { h_n: true }, recurrence: timesPerDay(1) }],
    ])
    const habits = makeHabits([
      ['h_u', { timestamp: COMPLETED_AFTER_TODAYS_OCCURRENCE, type: 'completed' }],
      ['h_n', {}],
    ])
    const result = build(groups, habits, `${MONDAY_DATE} 16:10`)
    expect(result.upNext[0].kind).toBe('now')
    expect(result.upNext[1].kind).toBe('upcoming')
  })

  it('preserves otherGroupIds in original Object.entries order', () => {
    // all completed after today's occurrence → not behind, next occurrence tomorrow → other
    const groups = makeGroups([
      ['g1', { habits: { h1: true }, recurrence: timesPerDay(1) }],
      ['g2', { habits: { h2: true }, recurrence: timesPerDay(1) }],
      ['g3', { habits: { h3: true }, recurrence: timesPerDay(1) }],
    ])
    const habits = makeHabits([
      ['h1', { timestamp: COMPLETED_AFTER_TODAYS_OCCURRENCE, type: 'completed' }],
      ['h2', { timestamp: COMPLETED_AFTER_TODAYS_OCCURRENCE, type: 'completed' }],
      ['h3', { timestamp: COMPLETED_AFTER_TODAYS_OCCURRENCE, type: 'completed' }],
    ])
    const result = build(groups, habits, `${MONDAY_DATE} 15:00`)
    expect(result.otherGroupIds).toEqual(['g1', 'g2', 'g3'])
  })

  it('no group appears in more than one section', () => {
    const groups = makeGroups([
      ['g_carried', { habits: { h1: true }, recurrence: timesPerDay(1) }],
      ['g_upcoming', { habits: { h2: true }, recurrence: timesPerDay(3) }],
      ['g_new', { habits: { h3: true }, recurrence: timesPerDay(1) }],
      ['g_other', { habits: { h4: true }, recurrence: timesPerDay(1) }],
    ])
    const habits = makeHabits([
      ['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }], // carried (behind 3h, has history)
      ['h2', { timestamp: COMPLETED_AFTER_TODAYS_OCCURRENCE, type: 'completed' }], // upcoming (next at 20:00)
      ['h3', {}], // new → now
      ['h4', { timestamp: COMPLETED_AFTER_TODAYS_OCCURRENCE, type: 'completed' }], // not behind, next tomorrow → other
    ])
    const result = build(groups, habits, `${MONDAY_DATE} 17:00`)

    const allIds = [
      ...result.carried.map(r => r.groupId),
      ...result.upNext.map(r => r.groupId),
      ...result.otherGroupIds,
    ]
    const unique = new Set(allIds)
    expect(unique.size).toBe(allIds.length)
    expect(unique.size).toBe(4)
    expect(result.carried.map(r => r.groupId)).toEqual(['g_carried'])
    expect(result.otherGroupIds).toEqual(['g_other'])
  })
})
