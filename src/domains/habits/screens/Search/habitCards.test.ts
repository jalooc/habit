import { describe, expect, it } from 'vitest'
import type { GroupsStore } from 'src/domains/habits/stores/groups'
import type { HabitsStore } from 'src/domains/habits/stores/habits'
import buildHabitCards, { describeHabitCard, isUpNextAnywhere } from './habitCards'

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const makeHabits = (entries: [string, string, number?][]): HabitsStore =>
  Object.fromEntries(entries.map(([habitId, name, timestamp]) => [
    habitId,
    { name, lastActioned: timestamp === undefined ? undefined : { timestamp, type: 'completed' }},
  ]))

const makeGroup = (name: string, habitIds: string[]): GroupsStore[string] => ({
  name,
  habits: Object.fromEntries(habitIds.map(habitId => [habitId, true as const])),
  lastServedAt: null,
})

describe('buildHabitCards', () => {
  it('builds one card per habit, even when it is in several rotations', () => {
    const habits = makeHabits([[id(1), 'A'], [id(2), 'B']])
    const groups = { [id(10)]: makeGroup('G1', [id(1), id(2)]), [id(11)]: makeGroup('G2', [id(1)]) }

    const cards = buildHabitCards(habits, groups)

    expect(Object.keys(cards)).toEqual([id(1), id(2)])
    expect(cards[id(1)].rotations).toHaveLength(2)
  })

  it('sorts rotations by queue position, soonest first', () => {
    const habits = makeHabits([[id(1), 'A', 500], [id(2), 'B', 100], [id(3), 'C', 200]])
    const groups = {
      [id(10)]: makeGroup('Back', [id(1), id(2), id(3)]),
      [id(11)]: makeGroup('Front', [id(1)]),
    }

    const { rotations } = buildHabitCards(habits, groups)[id(1)]

    expect(rotations.map(({ groupName, index, count }) => ({ groupName, index, count })))
      .toEqual([
        { groupName: 'Front', index: 0, count: 1 },
        { groupName: 'Back', index: 2, count: 3 },
      ])
  })

  it('does not count ids the habits store does not hold', () => {
    const habits = makeHabits([[id(1), 'A', 100], [id(2), 'B', 200]])
    const groups = { [id(10)]: makeGroup('G', [id(1), id(2), id(99)]) }

    const { rotations } = buildHabitCards(habits, groups)[id(2)]

    expect(rotations).toHaveLength(1)
    expect(rotations[0]).toMatchObject({ index: 1, count: 2 })
  })

  it('gives a habit in no rotation an empty rotations list', () => {
    const cards = buildHabitCards(makeHabits([[id(1), 'A']]), {})

    expect(cards[id(1)]).toEqual({ habitId: id(1), name: 'A', rotations: [] })
  })
})

describe('isUpNextAnywhere', () => {
  it('is true when the habit is up next in some rotation', () => {
    const habits = makeHabits([[id(1), 'A', 100], [id(2), 'B', 200]])
    const groups = { [id(10)]: makeGroup('G1', [id(1), id(2)]), [id(11)]: makeGroup('G2', [id(2)]) }

    const cards = buildHabitCards(habits, groups)

    expect(isUpNextAnywhere(cards[id(2)])).toBe(true)
  })

  it('is false when it is behind in every rotation or in none', () => {
    const habits = makeHabits([[id(1), 'A', 100], [id(2), 'B', 200], [id(3), 'C']])
    const groups = { [id(10)]: makeGroup('G1', [id(1), id(2)]) }

    const cards = buildHabitCards(habits, groups)

    expect(isUpNextAnywhere(cards[id(2)])).toBe(false)
    expect(isUpNextAnywhere(cards[id(3)])).toBe(false)
  })
})

describe('describeHabitCard', () => {
  it('describes the habit and its place in each rotation', () => {
    const habits = makeHabits([
      [id(1), 'Hollow hold, 45s', 100],
      ...[2, 3, 4, 5].map((n): [string, string, number] => [id(n), `Core ${n}`, 1000 + n]),
      ...[6, 7].map((n): [string, string, number] => [id(n), `Early ${n}`, n]),
      ...[8, 9, 10].map((n): [string, string, number] => [id(n), `Late ${n}`, 1000 + n]),
    ])
    const groups = {
      [id(20)]: makeGroup('Core', [1, 2, 3, 4, 5].map(id)),
      [id(21)]: makeGroup('Mobility', [1, 6, 7, 8, 9, 10].map(id)),
    }

    const cards = buildHabitCards(habits, groups)

    expect(describeHabitCard(cards[id(1)])).toBe('Hollow hold, 45s. Core, up next of 5. Mobility, 3rd of 6.')
  })
})
