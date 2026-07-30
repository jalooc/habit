import { describe, expect, it } from 'vitest'

import calcDayTimeSpan from './calcDayTimeSpan'

const time = (hour: number, minute: number) => ({ hour, minute })

describe('same-day boundaries', () => {
  it('returns the span between start and end', () => {
    expect(calcDayTimeSpan({ start: time(8, 0), end: time(22, 0) })).toEqual({
      dayTimeSpan: 14 * 60,
      startMinutes: 8 * 60,
      endMinutes: 22 * 60,
    })
  })

  it('includes minutes in the span', () => {
    expect(calcDayTimeSpan({ start: time(8, 30), end: time(21, 45) })).toEqual({
      dayTimeSpan: 13 * 60 + 15,
      startMinutes: 8 * 60 + 30,
      endMinutes: 21 * 60 + 45,
    })
  })

  it('handles a day starting at midnight', () => {
    expect(calcDayTimeSpan({ start: time(0, 0), end: time(23, 59) })).toEqual({
      dayTimeSpan: 23 * 60 + 59,
      startMinutes: 0,
      endMinutes: 23 * 60 + 59,
    })
  })
})

describe('boundaries across midnight', () => {
  it('sums the pre-midnight and post-midnight parts', () => {
    expect(calcDayTimeSpan({ start: time(22, 0), end: time(6, 0) })).toEqual({
      dayTimeSpan: 8 * 60,
      startMinutes: 22 * 60,
      endMinutes: 6 * 60,
    })
  })

  it('includes minutes on both sides of midnight', () => {
    expect(calcDayTimeSpan({ start: time(22, 30), end: time(6, 15) })).toEqual({
      dayTimeSpan: 7 * 60 + 45,
      startMinutes: 22 * 60 + 30,
      endMinutes: 6 * 60 + 15,
    })
  })

  it('handles a span ending exactly at midnight', () => {
    expect(calcDayTimeSpan({ start: time(23, 59), end: time(0, 0) })).toEqual({
      dayTimeSpan: 1,
      startMinutes: 23 * 60 + 59,
      endMinutes: 0,
    })
  })
})

describe('zero-duration boundaries', () => {
  it('throws a RangeError when start equals end', () => {
    expect(() => calcDayTimeSpan({ start: time(9, 30), end: time(9, 30) })).toThrow(RangeError)
  })

  it('throws a RangeError for midnight-to-midnight', () => {
    expect(() => calcDayTimeSpan({ start: time(0, 0), end: time(0, 0) })).toThrow(RangeError)
  })
})
