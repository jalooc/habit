import { describe, expect, it } from 'vitest'
import { RRuleTemporal } from 'rrule-temporal'
import { Temporal } from '@js-temporal/polyfill'
import type { HabitsStores } from 'src/domains/habits/stores/habits'
import buildHomeSections from './buildHomeSections'

const tzid = 'UTC'
const zdt = (iso: string) => Temporal.ZonedDateTime.from(`${iso}[${tzid}]`)

// Recurrence that fires daily from a given dtstart
const dailyAt = (dtstart: string) =>
  new RRuleTemporal({ freq: 'DAILY', interval: 1, dtstart: zdt(dtstart), tzid })

// A recurrence whose first occurrence is far in the future
const futureOnly = new RRuleTemporal({
  freq: 'DAILY',
  dtstart: zdt('2030-01-01T09:00:00'),
  tzid,
})

// Default day boundaries: 07:00–23:00 (non-wrapping)
const defaultBoundaries = { start: { hour: 7, minute: 0 }, end: { hour: 23, minute: 0 }}

// now = 2026-06-10 12:00:00 UTC
const NOW = new Date('2026-06-10T12:00:00Z').getTime()
// a real completion from yesterday — older than today's 09:00 occurrence, so "behind"
const COMPLETED_YESTERDAY = new Date('2026-06-09T12:00:00Z').getTime()

type GroupEntry = {
  name?: string,
  habits: Record<string, true>,
  recurrence?: RRuleTemporal | undefined,
}

const makeGroups = (entries: [string, GroupEntry][]) =>
  Object.fromEntries(entries.map(([id, { name, ...rest }]) => [id, {
    name: name ?? `Group ${id}`,
    recurrence: undefined,
    ...rest,
  }]))

const makeHabits = (entries: [string, { timestamp?: number, type?: 'completed' | 'skipped' }][]): HabitsStores =>
  Object.fromEntries(entries.map(([id, opts]) => [id, {
    name: `Habit ${id}`,
    ...(opts.timestamp !== undefined && {
      lastActioned: { timestamp: opts.timestamp, type: opts.type ?? 'completed' },
    }),
  }]))

describe('buildHomeSections', () => {
  it('places a group with no habits into other', () => {
    const groups = makeGroups([['g1', { habits: {}, recurrence: dailyAt('2026-01-01T09:00:00') }]])
    const habits = makeHabits([])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.otherGroupIds).toContain('g1')
    expect(result.carried).toHaveLength(0)
    expect(result.upNext).toHaveLength(0)
  })

  it('places a group with no recurrence into other', () => {
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: undefined }]])
    const habits = makeHabits([['h1', {}]])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.otherGroupIds).toContain('g1')
  })

  it('places into carried when the last completed tick is older than the last occurrence (> 15 min behind)', () => {
    // daily at 09:00; now = 12:00 → last occ = 09:00 → elapsed = 3h (> 15 min)
    // completed yesterday (before today's occurrence) → behind, with a real history
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: dailyAt('2026-01-01T09:00:00') }]])
    const habits = makeHabits([['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }]])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.carried).toHaveLength(1)
    expect(result.carried[0].groupId).toBe('g1')
    expect(result.carried[0].dueSinceMs).toBe(3 * 60 * 60 * 1000)
    expect(result.upNext).toHaveLength(0)
    expect(result.otherGroupIds).not.toContain('g1')
  })

  it('places a completed rotation that fell behind ≤ 15 min into upNext (now kind)', () => {
    // last occ = 11:50 (10 min ago); completed yesterday → behind within the NOW window
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: dailyAt('2026-06-10T11:50:00') }]])
    const habits = makeHabits([['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }]])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.upNext).toHaveLength(1)
    expect(result.upNext[0].kind).toBe('now')
    expect(result.carried).toHaveLength(0)
  })

  it('places a completed rotation behind by exactly 15 min into upNext (now kind)', () => {
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: dailyAt('2026-06-10T11:45:00') }]])
    const habits = makeHabits([['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }]])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.upNext).toHaveLength(1)
    expect(result.upNext[0].kind).toBe('now')
  })

  it('places a completed rotation behind by more than 15 min into carried', () => {
    // last occ = 11:44 (16 min ago) → past the NOW window
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: dailyAt('2026-06-10T11:44:00') }]])
    const habits = makeHabits([['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }]])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.carried).toHaveLength(1)
    expect(result.upNext).toHaveLength(0)
  })

  it('surfaces a never-completed rotation in upNext (now), never in carried — even when long overdue', () => {
    // daily at 09:00, now 12:00 → 3h "behind", but the habit has never been completed.
    // A brand-new rotation has no history to carry over → it belongs at the top of Up next.
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: dailyAt('2026-01-01T09:00:00') }]])
    const habits = makeHabits([['h1', {}]])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.carried).toHaveLength(0)
    expect(result.upNext).toHaveLength(1)
    expect(result.upNext[0].kind).toBe('now')
    expect(result.upNext[0].groupId).toBe('g1')
  })

  it('sorts never-completed rotations ahead of completed "now" rows in upNext', () => {
    // g_new: never completed, 3h behind → new "now"
    // g_recent: completed history, fell behind 10 min → "now"
    const groups = makeGroups([
      ['g_recent', { habits: { h_r: true }, recurrence: dailyAt('2026-06-10T11:50:00') }],
      ['g_new', { habits: { h_n: true }, recurrence: dailyAt('2026-01-01T09:00:00') }],
    ])
    const habits = makeHabits([
      ['h_r', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }],
      ['h_n', {}],
    ])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.upNext.map(r => r.groupId)).toEqual(['g_new', 'g_recent'])
  })

  it('treats a skip-only rotation (never completed) as new → upNext, not carried', () => {
    // only ever skipped, never completed → lastCompletedMs undefined → new
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: dailyAt('2026-01-01T09:00:00') }]])
    const habits = makeHabits([['h1', { timestamp: NOW - 2 * 60 * 60 * 1000, type: 'skipped' }]])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.carried).toHaveLength(0)
    expect(result.upNext).toHaveLength(1)
    expect(result.upNext[0].kind).toBe('now')
  })

  it('keeps a rotation carried when its up-next was skipped but it has an older completion (skip ≠ complete)', () => {
    // h1 completed yesterday (the real history); h2 only skipped today → lastCompleted = yesterday < 09:00
    const groups = makeGroups([['g1', { habits: { h1: true, h2: true }, recurrence: dailyAt('2026-01-01T09:00:00') }]])
    const habits = makeHabits([
      ['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }],
      ['h2', { timestamp: NOW - 30 * 60 * 1000, type: 'skipped' }],
    ])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.carried).toHaveLength(1)
  })

  it('places into upcoming when not behind and next occurrence is within today window', () => {
    // next occ = 17:00 today; completed after the previous occurrence → not behind
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: dailyAt('2026-06-10T17:00:00') }]])
    const habits = makeHabits([['h1', { timestamp: new Date('2026-06-09T17:30:00Z').getTime(), type: 'completed' }]])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.upNext).toHaveLength(1)
    expect(result.upNext[0].kind).toBe('upcoming')
    if (result.upNext[0].kind === 'upcoming') {
      expect(result.upNext[0].slotMs).toBe(new Date('2026-06-10T17:00:00Z').getTime())
    }
  })

  it('places into other when not behind and next occurrence is beyond today window', () => {
    // completed today after last occ → not behind; next occ = tomorrow 09:00 → beyond today → other
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: dailyAt('2026-01-01T09:00:00') }]])
    const habits = makeHabits([['h1', { timestamp: new Date('2026-06-10T09:30:00Z').getTime(), type: 'completed' }]])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.otherGroupIds).toContain('g1')
    expect(result.carried).toHaveLength(0)
    expect(result.upNext).toHaveLength(0)
  })

  it('routes a future-only recurrence to other', () => {
    const groups = makeGroups([['g1', { habits: { h1: true }, recurrence: futureOnly }]])
    const habits = makeHabits([['h1', {}]])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.otherGroupIds).toContain('g1')
  })

  it('sorts carried oldest-first (dueSinceMs descending)', () => {
    // g1 behind 3h (occ 09:00), g2 behind 1h (occ 11:00) — both with a real completion history
    const groups = makeGroups([
      ['g1', { habits: { h1: true }, recurrence: dailyAt('2026-01-01T09:00:00') }],
      ['g2', { habits: { h2: true }, recurrence: dailyAt('2026-01-01T11:00:00') }],
    ])
    const habits = makeHabits([
      ['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }],
      ['h2', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }],
    ])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.carried).toHaveLength(2)
    expect(result.carried[0].groupId).toBe('g1')
    expect(result.carried[1].groupId).toBe('g2')
  })

  it('sorts upNext: now rows before upcoming rows', () => {
    // now row: never-completed, behind → new "now"; upcoming row: not behind, next occ 17:00
    const upcomingRule = dailyAt('2026-06-10T17:00:00')
    const groups = makeGroups([
      ['g_upcoming', { habits: { h_u: true }, recurrence: upcomingRule }],
      ['g_now', { habits: { h_n: true }, recurrence: dailyAt('2026-01-01T09:00:00') }],
    ])
    const habits = makeHabits([
      ['h_u', { timestamp: new Date('2026-06-09T17:30:00Z').getTime(), type: 'completed' }],
      ['h_n', {}],
    ])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.upNext[0].kind).toBe('now')
    expect(result.upNext[1].kind).toBe('upcoming')
  })

  it('preserves otherGroupIds in original Object.entries order', () => {
    const rule = dailyAt('2026-01-01T09:00:00')
    const completedMs = new Date('2026-06-10T09:30:00Z').getTime() // after today's occ → not behind → other
    const groups = makeGroups([
      ['g1', { habits: { h1: true }, recurrence: rule }],
      ['g2', { habits: { h2: true }, recurrence: rule }],
      ['g3', { habits: { h3: true }, recurrence: rule }],
    ])
    const habits = makeHabits([
      ['h1', { timestamp: completedMs, type: 'completed' }],
      ['h2', { timestamp: completedMs, type: 'completed' }],
      ['h3', { timestamp: completedMs, type: 'completed' }],
    ])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })
    expect(result.otherGroupIds).toEqual(['g1', 'g2', 'g3'])
  })

  it('no group appears in more than one section', () => {
    const completedAfterOcc = new Date('2026-06-10T09:30:00Z').getTime()
    const groups = makeGroups([
      ['g_carried', { habits: { h1: true }, recurrence: dailyAt('2026-01-01T09:00:00') }],
      ['g_upcoming', { habits: { h2: true }, recurrence: dailyAt('2026-06-10T17:00:00') }],
      ['g_new', { habits: { h3: true }, recurrence: dailyAt('2026-01-01T09:00:00') }],
      ['g_other', { habits: { h4: true }, recurrence: dailyAt('2026-01-01T09:00:00') }],
    ])
    const habits = makeHabits([
      ['h1', { timestamp: COMPLETED_YESTERDAY, type: 'completed' }], // carried (behind 3h, has history)
      ['h2', { timestamp: new Date('2026-06-09T17:30:00Z').getTime(), type: 'completed' }], // upcoming
      ['h3', {}], // new → now
      ['h4', { timestamp: completedAfterOcc, type: 'completed' }], // not behind, next tomorrow → other
    ])
    const result = buildHomeSections({ groups, habits, dayBoundaries: defaultBoundaries, now: NOW })

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
