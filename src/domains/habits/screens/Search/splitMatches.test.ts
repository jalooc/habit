import { describe, expect, it } from 'vitest'
import splitMatches from './splitMatches'

const texts = (text: string, spans: Parameters<typeof splitMatches>[1]) =>
  splitMatches(text, spans).map(run => run.isMatch ? `[${run.text}]` : run.text).join('')

describe('splitMatches', () => {
  it('returns one plain run without matches', () => {
    expect(splitMatches('Plank', [])).toEqual([{ text: 'Plank', isMatch: false, start: 0 }])
  })

  it('splits around matches at the start, middle and end', () => {
    expect(texts('Hollow hold', [[0, 3], [5, 6], [9, 11]])).toBe('[Hol]lo[w] ho[ld]')
  })

  it('merges overlapping and touching spans', () => {
    expect(texts('Side plank', [[5, 8], [7, 9], [9, 10]])).toBe('Side [plank]')
  })

  it('keeps an emoji whole', () => {
    expect(texts('🧘 Yoga', [[0, 2]])).toBe('[🧘] Yoga')
  })
})
