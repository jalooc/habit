import { describe, expect, it } from 'vitest'
import { formatStanding } from './rotationStanding'

describe('formatStanding', () => {
  it('labels the first slot as up next', () => {
    expect(formatStanding(0)).toBe('up next')
  })

  it('labels later slots with their ordinal', () => {
    expect(formatStanding(1)).toBe('2nd in line')
    expect(formatStanding(2)).toBe('3rd in line')
    expect(formatStanding(3)).toBe('4th in line')
  })

  it('handles the 11th-13th ordinal exception', () => {
    expect(formatStanding(10)).toBe('11th in line')
    expect(formatStanding(11)).toBe('12th in line')
    expect(formatStanding(12)).toBe('13th in line')
  })

  it('handles ordinals past twenty', () => {
    expect(formatStanding(20)).toBe('21st in line')
    expect(formatStanding(21)).toBe('22nd in line')
  })
})
