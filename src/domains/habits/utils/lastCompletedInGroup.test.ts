import { describe, expect, it } from 'vitest'
import lastCompletedInGroup from './lastCompletedInGroup'
import type { HabitsStores } from 'src/domains/habits/stores/habits'

const makeHabits = (entries: [string, { timestamp: number, type: 'completed' | 'skipped' } | undefined][]): HabitsStores =>
  Object.fromEntries(entries.map(([id, lastActioned]) => [id, {
    name: `Habit ${id}`,
    ...(lastActioned !== undefined && { lastActioned }),
  }]))

describe('lastCompletedInGroup', () => {
  it('returns undefined when no habits have been actioned', () => {
    const habits = makeHabits([
      ['a', undefined],
      ['b', undefined],
    ])
    expect(lastCompletedInGroup(['a', 'b'], habits)).toBeUndefined()
  })

  it('returns undefined when all ticks are skipped', () => {
    const habits = makeHabits([
      ['a', { timestamp: 1000, type: 'skipped' }],
      ['b', { timestamp: 2000, type: 'skipped' }],
    ])
    expect(lastCompletedInGroup(['a', 'b'], habits)).toBeUndefined()
  })

  it('returns the timestamp of a single completed habit', () => {
    const habits = makeHabits([
      ['a', { timestamp: 5000, type: 'completed' }],
    ])
    expect(lastCompletedInGroup(['a'], habits)).toBe(5000)
  })

  it('returns the max timestamp across multiple completed habits', () => {
    const habits = makeHabits([
      ['a', { timestamp: 1000, type: 'completed' }],
      ['b', { timestamp: 9000, type: 'completed' }],
      ['c', { timestamp: 3000, type: 'completed' }],
    ])
    expect(lastCompletedInGroup(['a', 'b', 'c'], habits)).toBe(9000)
  })

  it('excludes skipped ticks and returns max of completed ones', () => {
    const habits = makeHabits([
      ['a', { timestamp: 8000, type: 'skipped' }],
      ['b', { timestamp: 3000, type: 'completed' }],
      ['c', { timestamp: 5000, type: 'completed' }],
    ])
    expect(lastCompletedInGroup(['a', 'b', 'c'], habits)).toBe(5000)
  })

  it('returns undefined for an empty habitIds list', () => {
    const habits = makeHabits([
      ['a', { timestamp: 5000, type: 'completed' }],
    ])
    expect(lastCompletedInGroup([], habits)).toBeUndefined()
  })
})
