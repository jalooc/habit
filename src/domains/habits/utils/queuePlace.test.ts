import { describe, expect, it } from 'vitest'
import { formatQueuePlace, splitQueuePlace } from './queuePlace'

describe('formatQueuePlace', () => {
  it('says "up next" for index 0', () => {
    expect(formatQueuePlace(0, 6)).toBe('up next of 6')
  })

  it.each([
    [1, '2nd of 200'],
    [2, '3rd of 200'],
    [3, '4th of 200'],
    [10, '11th of 200'],
    [11, '12th of 200'],
    [12, '13th of 200'],
    [20, '21st of 200'],
    [21, '22nd of 200'],
    [110, '111th of 200'],
  ])('formats index %i as %s', (index, expected) => {
    expect(formatQueuePlace(index, 200)).toBe(expected)
  })
})

describe('splitQueuePlace', () => {
  it('splits the up-next place', () => {
    expect(splitQueuePlace(0, 5)).toEqual({ isUpNext: true, place: 'up next', ofTotal: ' of 5' })
  })

  it('splits a later place', () => {
    expect(splitQueuePlace(2, 6)).toEqual({ isUpNext: false, place: '3rd', ofTotal: ' of 6' })
  })
})
