import { describe, expect, it } from 'vitest'
import foldText from './foldText'

describe('foldText', () => {
  it.each([
    ['Łódź', 'lodz'],
    ['ł', 'l'],
    ['Ł', 'l'],
    ['żółć', 'zolc'],
    ['Crème brûlée', 'creme brulee'],
  ])('folds %s to %s', (input, expected) => {
    expect(foldText(input)).toBe(expected)
  })

  it('lower-cases', () => {
    expect(foldText('Hollow HOLD')).toBe('hollow hold')
  })

  it('leaves plain ASCII untouched', () => {
    expect(foldText('plank 45s')).toBe('plank 45s')
  })
})
