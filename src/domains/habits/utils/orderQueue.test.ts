import { describe, expect, it } from 'vitest'
import type { HabitsStores } from '../stores/habits'
import orderQueue from './orderQueue'

const makeHabits = (entries: [string, number | undefined][]): HabitsStores =>
  Object.fromEntries(
    entries.map(([id, ts]): [string, HabitsStores[string]] => [
      id,
      {
        name: id,
        lastActioned: ts !== undefined ? { timestamp: ts, type: 'completed' } : undefined,
      },
    ]),
  )

describe('orderQueue', () => {
  it('returns empty array for empty input', () => {
    expect(orderQueue([], makeHabits([]))).toEqual([])
  })

  it('puts never-actioned habits first (timestamp treated as 0)', () => {
    const habits = makeHabits([
      ['a', 1000],
      ['b', undefined],
    ])
    expect(orderQueue(['a', 'b'], habits)).toEqual(['b', 'a'])
  })

  it('sorts ascending by timestamp', () => {
    const habits = makeHabits([
      ['a', 3000],
      ['b', 1000],
      ['c', 2000],
    ])
    expect(orderQueue(['a', 'b', 'c'], habits)).toEqual(['b', 'c', 'a'])
  })

  it('is stable for equal timestamps (never-actioned ties)', () => {
    const habits = makeHabits([
      ['a', undefined],
      ['b', undefined],
      ['c', 1000],
    ])
    const result = orderQueue(['a', 'b', 'c'], habits)
    expect(result[2]).toBe('c')
    expect(new Set(['a', 'b']).has(result[0])).toBe(true)
    expect(new Set(['a', 'b']).has(result[1])).toBe(true)
  })

  it('does not mutate the input array', () => {
    const ids = ['a', 'b']
    const habits = makeHabits([['a', 2000], ['b', 1000]])
    orderQueue(ids, habits)
    expect(ids).toEqual(['a', 'b'])
  })
})
