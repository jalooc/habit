import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import nextTurnDueAt from './nextTurnDueAt'

const MONDAY_DATE = '2026-07-06'

const time = (hour: number, minute: number) => ({ hour, minute })

// 08:00–20:00 boundaries: timesPerDay(3) opens turns at 08:00/12:00/16:00,
// coming due at 10:00/14:00/18:00
const dayBoundaries = { start: time(8, 0), end: time(20, 0) }

const timesPerDay = (value: number, specificDays?: Parameters<typeof nextTurnDueAt>[0]['recurrence']['specificDays']) =>
  ({ type: 'times-per-day', value, specificDays } as const)

const NEVER_SERVED = null

const dueAt = (
  recurrence: Parameters<typeof nextTurnDueAt>[0]['recurrence'],
  now: string,
  lastServed: string | null = NEVER_SERVED,
  boundaries = dayBoundaries,
) => nextTurnDueAt({
  recurrence,
  lastServedAt: lastServed === null ? NEVER_SERVED : dayjs(lastServed).valueOf(),
  now: dayjs(now),
  dayBoundaries: boundaries,
})?.format('YYYY-MM-DD HH:mm')

describe('nextTurnDueAt', () => {
  it('announces the current turn while it is unserved', () => {
    expect(dueAt(timesPerDay(3), `${MONDAY_DATE} 13:00`, `${MONDAY_DATE} 09:00`)).toBe(`${MONDAY_DATE} 14:00`)
  })

  it('steps over the current turn once it is served', () => {
    // turn 2 opens 12:00 and comes due 14:00; completing at 13:00 serves it
    expect(dueAt(timesPerDay(3), `${MONDAY_DATE} 13:00`, `${MONDAY_DATE} 13:00`)).toBe(`${MONDAY_DATE} 18:00`)
  })

  it('counts a completion made before the turn came due', () => {
    // 12:30 is inside turn 2 but ahead of its 14:00 due moment — still served
    expect(dueAt(timesPerDay(3), `${MONDAY_DATE} 12:45`, `${MONDAY_DATE} 12:30`)).toBe(`${MONDAY_DATE} 18:00`)
  })

  it('hands off to the next day when the day\'s last turn is served', () => {
    // turn 3 opens 16:00; serving it at 16:30 leaves nothing else today
    expect(dueAt(timesPerDay(3), `${MONDAY_DATE} 16:30`, `${MONDAY_DATE} 16:30`)).toBe('2026-07-07 10:00')
  })

  it('answers with the coming day from inside the quiet gap after active hours', () => {
    // no current turn outside active hours, so nothing can be served — fall through to the next
    expect(dueAt(timesPerDay(3), `${MONDAY_DATE} 22:00`, `${MONDAY_DATE} 17:00`)).toBe('2026-07-07 10:00')
  })

  it('answers with today from inside the quiet gap before active hours', () => {
    expect(dueAt(timesPerDay(3), `${MONDAY_DATE} 06:00`, NEVER_SERVED)).toBe(`${MONDAY_DATE} 10:00`)
  })

  it('never looks back at a turn that is past due and unserved', () => {
    // 19:00 with the 18:00 turn unserved: the rotation is behind, which is isGroupDue's business.
    // This answers what is still to come, so it is tomorrow's first turn.
    expect(dueAt(timesPerDay(3), `${MONDAY_DATE} 19:00`, `${MONDAY_DATE} 09:00`)).toBe('2026-07-07 10:00')
  })

  it('skips days the recurrence does not run', () => {
    const thursdayOnly = timesPerDay(1, { mo: false, tu: false, we: false, th: true, fr: false, sa: false, su: false })
    expect(dueAt(thursdayOnly, `${MONDAY_DATE} 12:00`, NEVER_SERVED)).toBe('2026-07-09 14:00')
  })

  it('does not treat a completion on an off day as serving the next running day\'s turn', () => {
    // completed Monday 12:00; the rotation only runs Thursday, whose turn opens Thursday 08:00
    const thursdayOnly = timesPerDay(1, { mo: false, tu: false, we: false, th: true, fr: false, sa: false, su: false })
    expect(dueAt(thursdayOnly, '2026-07-09 09:00', `${MONDAY_DATE} 12:00`)).toBe('2026-07-09 14:00')
  })

  it('serves a turn on a running day like any other', () => {
    const thursdayOnly = timesPerDay(1, { mo: false, tu: false, we: false, th: true, fr: false, sa: false, su: false })
    expect(dueAt(thursdayOnly, '2026-07-09 09:00', '2026-07-09 08:30')).toBe('2026-07-16 14:00')
  })

  it('carries a turn across midnight', () => {
    // 22:00–06:00 boundaries: the single turn opens 22:00 and comes due 02:00
    const boundaries = { start: time(22, 0), end: time(6, 0) }
    expect(dueAt(timesPerDay(1), `${MONDAY_DATE} 23:00`, NEVER_SERVED, boundaries)).toBe('2026-07-07 02:00')
    expect(dueAt(timesPerDay(1), `${MONDAY_DATE} 23:00`, `${MONDAY_DATE} 22:30`, boundaries))
      .toBe('2026-07-08 02:00')
  })
})
