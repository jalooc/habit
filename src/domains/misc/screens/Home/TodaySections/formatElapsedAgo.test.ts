import { describe, expect, it } from 'vitest'
import formatElapsedAgo from './formatElapsedAgo'

const min = (n: number) => n * 60 * 1000
const hour = (n: number) => n * 60 * min(1)
const day = (n: number) => n * 24 * hour(1)

describe('formatElapsedAgo', () => {
  it('returns "0m" for zero ms', () => {
    expect(formatElapsedAgo(0)).toBe('0m')
  })

  it('clamps negative values to "0m"', () => {
    expect(formatElapsedAgo(-5000)).toBe('0m')
  })

  it('returns minutes for values under 60 min', () => {
    expect(formatElapsedAgo(min(1))).toBe('1m')
    expect(formatElapsedAgo(min(8))).toBe('8m')
    expect(formatElapsedAgo(min(59))).toBe('59m')
  })

  it('returns hours for values under 24 h (floors)', () => {
    expect(formatElapsedAgo(hour(1))).toBe('1h')
    expect(formatElapsedAgo(hour(2))).toBe('2h')
    expect(formatElapsedAgo(hour(2) + min(45))).toBe('2h')
    expect(formatElapsedAgo(hour(23) + min(59))).toBe('23h')
  })

  it('returns days for values 24 h and above (floors)', () => {
    expect(formatElapsedAgo(day(1))).toBe('1d')
    expect(formatElapsedAgo(day(3))).toBe('3d')
    expect(formatElapsedAgo(day(3) + hour(12))).toBe('3d')
  })
})
