import { describe, expect, it } from 'vitest'
import isStepRotation from './isStepRotation'

describe('isStepRotation', () => {
  it('returns true for a valid left rotation by one step', () => {
    expect(isStepRotation(['a', 'b', 'c'], ['b', 'c', 'a'])).toBe(true)
  })

  it('returns true for a two-element rotation', () => {
    expect(isStepRotation(['a', 'b'], ['b', 'a'])).toBe(true)
  })

  it('returns false for equal arrays (no rotation)', () => {
    expect(isStepRotation(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(false)
  })

  it('returns false for an arbitrary reorder', () => {
    expect(isStepRotation(['a', 'b', 'c'], ['c', 'a', 'b'])).toBe(false)
  })

  it('returns false when lengths differ', () => {
    expect(isStepRotation(['a', 'b', 'c'], ['b', 'c'])).toBe(false)
  })

  it('returns false for n=1 (single element)', () => {
    expect(isStepRotation(['a'], ['a'])).toBe(false)
  })

  it('returns false for n=0 (empty arrays)', () => {
    expect(isStepRotation([], [])).toBe(false)
  })

  it('returns false when only the last element moves but middle reorders', () => {
    expect(isStepRotation(['a', 'b', 'c', 'd'], ['b', 'd', 'c', 'a'])).toBe(false)
  })
})
