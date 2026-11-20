import { describe, expect, it } from 'vitest'
import type { GroupsStore } from 'src/domains/habits/stores/groups'
import type { HabitsStore } from 'src/domains/habits/stores/habits'
import buildHabitCards, { isUpNextAnywhere } from './habitCards'
import searchHabits, { createHabitIndex } from './searchHabits'

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

type HabitSeed = [id: string, name: string, timestamp?: number, description?: string]

const makeHabits = (seeds: HabitSeed[]): HabitsStore =>
  Object.fromEntries(seeds.map(([habitId, name, timestamp, description]) => [
    habitId,
    { name, description, lastActioned: timestamp === undefined ? undefined : { timestamp, type: 'completed' }},
  ]))

const makeGroups = (...rotations: [groupId: string, habitIds: string[]][]): GroupsStore =>
  Object.fromEntries(rotations.map(([groupId, habitIds]) => [
    groupId,
    {
      name: `Group ${groupId.slice(-2)}`,
      habits: Object.fromEntries(habitIds.map(habitId => [habitId, true as const])),
      lastServedAt: null,
    },
  ]))

const searchResults = (query: string, habits: HabitsStore, groups: GroupsStore = {}) => {
  const cards = buildHabitCards(habits, groups)

  return searchHabits(query, createHabitIndex(habits), habitId => isUpNextAnywhere(cards[habitId]))
}

const search = (query: string, habits: HabitsStore, groups: GroupsStore = {}) =>
  searchResults(query, habits, groups).map(({ habitId }) => habitId)

const nameMatches = (query: string, name: string) =>
  searchResults(query, makeHabits([[id(1), name]])).map(result => result.nameMatches)

describe('searchHabits', () => {
  it('tolerates a typo', () => {
    const habits = makeHabits([[id(1), 'Hollow hold, 45s'], [id(2), 'Plank']])

    expect(search('hollw', habits)).toEqual([id(1)])
  })

  it.each(['lodz', 'łódź', 'ŁÓDŹ'])('finds "Łódź walk" by %s', query => {
    const habits = makeHabits([[id(1), 'Łódź walk'], [id(2), 'Plank']])

    expect(search(query, habits)).toEqual([id(1)])
  })

  it('matches a folded query against a diacritic name and vice versa', () => {
    const habits = makeHabits([[id(1), 'Łódź'], [id(2), 'Lodz park']])

    expect(search('lodz', habits).toSorted()).toEqual([id(1), id(2)].toSorted())
    expect(search('łódź', habits).toSorted()).toEqual([id(1), id(2)].toSorted())
  })

  it('searches names only', () => {
    const habits = makeHabits([[id(1), 'Plank', undefined, 'Squeeze the glutes and breathe']])

    expect(search('glutes', habits)).toEqual([])
  })

  it.each([
    ['first inserted is up next', [[id(1), 'Side plank', 0], [id(2), 'Rear plank', 100]] satisfies HabitSeed[], id(1)],
    ['last inserted is up next', [[id(1), 'Side plank', 100], [id(2), 'Rear plank', 0]] satisfies HabitSeed[], id(2)],
  ])('puts the up-next habit first on a tie (%s)', (_label, seeds, upNext) => {
    const habits = makeHabits(seeds)
    const groups = makeGroups([id(10), [id(1), id(2)]])

    const results = search('plank', habits, groups)

    expect(results[0]).toBe(upNext)
    expect(results).toHaveLength(2)
  })

  it('returns a habit linked into two rotations once', () => {
    const habits = makeHabits([[id(1), 'Plank', 0], [id(2), 'Squat', 5]])
    const groups = makeGroups([id(10), [id(1), id(2)]], [id(11), [id(1)]])

    expect(search('plank', habits, groups)).toEqual([id(1)])
  })

  it.each(['', '   '])('returns nothing for the blank query %j', query => {
    expect(search(query, makeHabits([[id(1), 'Plank']]))).toEqual([])
  })

  it('reports where the query matched in the name', () => {
    expect(nameMatches('plank', 'Side plank')).toEqual([[[5, 10]]])
  })

  it('reports every place the query appears', () => {
    expect(nameMatches('hol', 'Hollow hold')).toEqual([[[0, 3], [7, 10]]])
  })

  it('reports the stretch a typo matched', () => {
    expect(nameMatches('hollw', 'Hollow hold, 45s')).toEqual([[[0, 6]]])
  })

  it('reports matches in the name as written, not as folded', () => {
    expect(nameMatches('strasse', 'Straße stretch')).toEqual([[[0, 6]]])
  })

  it('returns nothing for a short query with no exact substring', () => {
    const habits = makeHabits([[id(1), 'Hollow hold, 45s'], [id(2), 'Plank'], [id(3), 'Łódź walk']])

    expect(search('xq', habits)).toEqual([])
  })
})
