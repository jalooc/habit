import { describe, expect, it } from 'vitest'

import { areDayBoundariesAcrossMidnight, areDayBoundariesZeroDuration } from './dayBoundaries'

const time = (hour: number, minute: number) => ({ hour, minute })

describe('areDayBoundariesAcrossMidnight', () => {
  it('is false when the span opens and closes on the same day', () => {
    expect(areDayBoundariesAcrossMidnight({ start: time(8, 0), end: time(22, 0) })).toBe(false)
  })

  it('is false for a span covering almost the whole day', () => {
    expect(areDayBoundariesAcrossMidnight({ start: time(0, 0), end: time(23, 59) })).toBe(false)
  })

  it('is true when the span closes on the following day', () => {
    expect(areDayBoundariesAcrossMidnight({ start: time(22, 0), end: time(6, 0) })).toBe(true)
  })

  it('compares minutes, not just hours', () => {
    expect(areDayBoundariesAcrossMidnight({ start: time(8, 30), end: time(8, 15) })).toBe(true)
    expect(areDayBoundariesAcrossMidnight({ start: time(8, 15), end: time(8, 30) })).toBe(false)
  })

  it('is true for a span ending exactly at midnight', () => {
    expect(areDayBoundariesAcrossMidnight({ start: time(23, 59), end: time(0, 0) })).toBe(true)
  })
})

describe('areDayBoundariesZeroDuration', () => {
  it('is true when the boundaries meet', () => {
    expect(areDayBoundariesZeroDuration({ start: time(9, 30), end: time(9, 30) })).toBe(true)
    expect(areDayBoundariesZeroDuration({ start: time(0, 0), end: time(0, 0) })).toBe(true)
  })

  it('is false whenever any active hours are left', () => {
    expect(areDayBoundariesZeroDuration({ start: time(8, 0), end: time(20, 0) })).toBe(false)
    expect(areDayBoundariesZeroDuration({ start: time(22, 0), end: time(6, 0) })).toBe(false)
    expect(areDayBoundariesZeroDuration({ start: time(9, 30), end: time(9, 31) })).toBe(false)
  })
})
