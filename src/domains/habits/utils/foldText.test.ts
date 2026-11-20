import { describe, expect, it } from 'vitest'
import foldText, { unfoldSpans } from './foldText'

describe('foldText', () => {
  it.each([
    ['Łódź', 'lodz'],
    ['ł', 'l'],
    ['Ł', 'l'],
    ['żółć', 'zolc'],
    ['Crème brûlée', 'creme brulee'],
    ['Straße', 'strasse'],
    ['Café', 'cafe'],
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

describe('unfoldSpans', () => {
  it('keeps spans where folding keeps lengths', () => {
    expect(unfoldSpans('Łódź walk', [[0, 4], [5, 9]])).toEqual([[0, 4], [5, 9]])
  })

  it('maps a span inside an expanded letter to the whole letter', () => {
    // "straße" folds to "strasse": folded 4–7 is "sse", which comes from "ße"
    expect(unfoldSpans('Straße', [[4, 7]])).toEqual([[4, 6]])
  })

  it('takes in an accent typed as its own character', () => {
    // "Cafe" + combining acute folds to "cafe": the folded "e" came from both
    expect(unfoldSpans('Café au lait', [[2, 4]])).toEqual([[2, 5]])
  })

  it('maps a span over part of an expanded letter to the whole letter', () => {
    expect(unfoldSpans('Straße', [[4, 5]])).toEqual([[4, 5]])
  })

  it('maps spans after an emoji', () => {
    expect(unfoldSpans('🧘 Yoga', [[3, 7]])).toEqual([[3, 7]])
  })

  it('maps a span over a decomposed Korean syllable back to the syllable', () => {
    // each syllable folds to three letters
    expect(unfoldSpans('한글', [[3, 6]])).toEqual([[1, 2]])
  })
})
