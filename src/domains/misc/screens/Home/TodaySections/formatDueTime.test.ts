import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import formatDueTime from './formatDueTime'

// Build dates in local time (matching the formatter's getHours/getMinutes)
const localDate = (hour: number, minute: number): Date => {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d
}

describe('formatDueTime', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('formats 17:00 → "5p"', () => {
    expect(formatDueTime(localDate(17, 0))).toBe('5p')
  })

  it('formats 9:00 → "9a"', () => {
    expect(formatDueTime(localDate(9, 0))).toBe('9a')
  })

  it('formats 0:00 → "12a"', () => {
    expect(formatDueTime(localDate(0, 0))).toBe('12a')
  })

  it('formats 12:00 → "12p"', () => {
    expect(formatDueTime(localDate(12, 0))).toBe('12p')
  })

  it('formats 17:30 → "5:30p"', () => {
    expect(formatDueTime(localDate(17, 30))).toBe('5:30p')
  })

  it('formats 9:05 → "9:05a"', () => {
    expect(formatDueTime(localDate(9, 5))).toBe('9:05a')
  })

  it('formats 0:30 → "12:30a"', () => {
    expect(formatDueTime(localDate(0, 30))).toBe('12:30a')
  })

  it('formats 23:59 → "11:59p"', () => {
    expect(formatDueTime(localDate(23, 59))).toBe('11:59p')
  })
})
