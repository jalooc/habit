import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { objectFromEntries } from 'tsafe'
import { RECURRENCE_TYPES, Weekday, WEEKDAYS } from 'src/domains/recurrence/utils/recurrence'

import getOccurrence, { isRecurrenceTypeImplemented } from './getOccurrence'

const MONDAY_DATE = '2026-07-06'

const time = (hour: number, minute: number) => ({ hour, minute })

const timesPerDay = (value: number, specificDays?: Record<Weekday, boolean>) =>
  ({ type: 'times-per-day', value, specificDays } as const)

const days = (...selected: Weekday[]) =>
  objectFromEntries(WEEKDAYS.map(day => [day, selected.includes(day)]))

const { next, previous } = (() => {
  const call = (getOccurrenceFunction: typeof getOccurrence['next'] | typeof getOccurrence['previous']) => (
    recurrence: Parameters<typeof getOccurrenceFunction>[0],
    referenceDate: string,
    boundaries: Parameters<typeof getOccurrenceFunction>[2],
  ) => {
    const occurrence = getOccurrenceFunction(recurrence, dayjs(referenceDate), boundaries)
    if (!occurrence) throw new Error('Expected an occurrence')
    return occurrence.format('YYYY-MM-DD HH:mm')
  }

  return {
    next: call(getOccurrence.next),
    previous: call(getOccurrence.previous),
  }
})()

const dayBoundaries = { start: time(8, 0), end: time(20, 0) }

describe('isRecurrenceTypeImplemented', () => {
  it.each(RECURRENCE_TYPES)('agrees with what the engine does for %s', type => {
    const askForOccurrence = () => getOccurrence.next({ type, value: 1 }, dayjs(`${MONDAY_DATE} 06:00`), dayBoundaries)

    if (isRecurrenceTypeImplemented(type)) {
      expect(askForOccurrence).not.toThrow()
    } else {
      expect(askForOccurrence).toThrow('not implemented')
    }
  })
})

describe('recurrence value validation', () => {
  it('throws a RangeError for a value lower than 1', () => {
    expect(() => next(timesPerDay(0), `${MONDAY_DATE} 06:00`, dayBoundaries)).toThrow(RangeError)
  })

  it('throws a RangeError for a negative value', () => {
    expect(() => next(timesPerDay(-2), `${MONDAY_DATE} 06:00`, dayBoundaries)).toThrow(RangeError)
  })

  it('throws a RangeError for a fractional value', () => {
    expect(() => next(timesPerDay(1.5), `${MONDAY_DATE} 06:00`, dayBoundaries)).toThrow(RangeError)
  })

  it('throws a RangeError for NaN', () => {
    expect(() => next(timesPerDay(NaN), `${MONDAY_DATE} 06:00`, dayBoundaries)).toThrow(RangeError)
  })

  it('throws a RangeError for Infinity', () => {
    expect(() => next(timesPerDay(Infinity), `${MONDAY_DATE} 06:00`, dayBoundaries)).toThrow(RangeError)
  })
})

describe('next occurrence', () => {
  describe('once a day', () => {
    it('places the occurrence in the middle of the day boundaries', () => {
      expect(next(timesPerDay(1), `${MONDAY_DATE} 06:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 14:00`)
    })

    it('returns an occurrence lying exactly at referenceDate', () => {
      expect(next(timesPerDay(1), `${MONDAY_DATE} 14:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 14:00`)
    })

    it('moves to the next day once the occurrence has passed', () => {
      expect(next(timesPerDay(1), `${MONDAY_DATE} 14:01`, dayBoundaries)).toBe('2026-07-07 14:00')
    })

    it('accounts for minutes in the boundaries', () => {
      const boundaries = { start: time(8, 30), end: time(21, 30) }
      expect(next(timesPerDay(1), `${MONDAY_DATE} 06:00`, boundaries)).toBe(`${MONDAY_DATE} 15:00`)
    })
  })

  // 08:00–20:00 boundaries: timesPerDay(2) fires at 11:00/17:00, timesPerDay(3) at 10:00/14:00/18:00
  describe('several times a day', () => {
    it('returns the first slot when starting before the day time span', () => {
      expect(next(timesPerDay(3), `${MONDAY_DATE} 06:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 10:00`)
    })

    it('returns the first slot when starting inside the span but ahead of it', () => {
      expect(next(timesPerDay(3), `${MONDAY_DATE} 09:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 10:00`)
    })

    it('returns the next slot when starting between slots', () => {
      expect(next(timesPerDay(3), `${MONDAY_DATE} 11:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 14:00`)
    })

    it('returns a slot lying exactly at referenceDate', () => {
      expect(next(timesPerDay(3), `${MONDAY_DATE} 14:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 14:00`)
    })

    it('skips to the following slot right after one has passed', () => {
      expect(next(timesPerDay(3), `${MONDAY_DATE} 14:01`, dayBoundaries)).toBe(`${MONDAY_DATE} 18:00`)
    })

    it('skips to the following occurrence within the same minute one has passed', () => {
      // Sub-minute references must not round back onto the occurrence that just fired: doing so
      // fails the "not before referenceDate" check and sends the search a whole day forward,
      // dropping every remaining occurrence of the day. This is the minute a notification lands in.
      expect(next(timesPerDay(3), `${MONDAY_DATE} 14:00:01`, dayBoundaries)).toBe(`${MONDAY_DATE} 18:00`)
      expect(next(timesPerDay(3), `${MONDAY_DATE} 14:00:30`, dayBoundaries)).toBe(`${MONDAY_DATE} 18:00`)
      expect(next(timesPerDay(3), `${MONDAY_DATE} 14:00:59`, dayBoundaries)).toBe(`${MONDAY_DATE} 18:00`)
    })

    it('keeps the whole day when the first occurrence passed seconds ago', () => {
      // The earlier the occurrence, the more the day-jump costs: here 14:00 and 18:00 both.
      expect(next(timesPerDay(3), `${MONDAY_DATE} 10:00:30`, dayBoundaries)).toBe(`${MONDAY_DATE} 14:00`)
    })

    it('rolls over to the next day after the last slot, still inside the day time span', () => {
      expect(next(timesPerDay(3), `${MONDAY_DATE} 18:01`, dayBoundaries)).toBe('2026-07-07 10:00')
    })

    it('centers two daily occurrences in their halves of the span, off the boundaries', () => {
      expect(next(timesPerDay(2), `${MONDAY_DATE} 06:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 11:00`)
      expect(next(timesPerDay(2), `${MONDAY_DATE} 11:01`, dayBoundaries)).toBe(`${MONDAY_DATE} 17:00`)
    })

    it('supports slots not divisible into whole minutes', () => {
      // 12h span / 7 slots ≈ 102.86 min, so the second slot lands at 10:34:17
      expect(next(timesPerDay(7), `${MONDAY_DATE} 08:52`, dayBoundaries)).toBe(`${MONDAY_DATE} 10:34`)
    })
  })

  describe('day boundaries across midnight', () => {
    const boundaries = { start: time(22, 0), end: time(6, 0) }

    it('places a single occurrence past midnight when the middle of the span falls there', () => {
      expect(next(timesPerDay(1), `${MONDAY_DATE} 20:00`, boundaries)).toBe('2026-07-07 02:00')
    })

    // 22:00–06:00 boundaries: timesPerDay(3) fires at 23:20/02:00/04:40
    it('finds the morning slot when starting inside the span past midnight', () => {
      expect(next(timesPerDay(3), '2026-07-07 03:00', boundaries)).toBe('2026-07-07 04:40')
    })

    it('finds the past-midnight slot when starting inside the span before midnight', () => {
      expect(next(timesPerDay(3), `${MONDAY_DATE} 23:30`, boundaries)).toBe('2026-07-07 02:00')
    })
  })

  describe('restricting to specific days', () => {
    it('returns the same-day occurrence when the day is enabled', () => {
      expect(next(timesPerDay(1, days('mo', 'we', 'fr')), `${MONDAY_DATE} 06:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 14:00`)
    })

    it('skips disabled weekdays', () => {
      expect(next(timesPerDay(1, days('mo', 'we', 'fr')), `${MONDAY_DATE} 15:00`, dayBoundaries)).toBe('2026-07-08 14:00')
    })

    it('waits a whole week when only one day is enabled', () => {
      expect(next(timesPerDay(1, days('mo')), `${MONDAY_DATE} 15:00`, dayBoundaries)).toBe('2026-07-13 14:00')
    })

    it('starts on the next enabled day when referenceDate falls on a disabled day', () => {
      expect(next(timesPerDay(1, days('su')), '2026-07-11 06:00', dayBoundaries)).toBe('2026-07-12 14:00')
    })

    it('keeps the intra-day spread on enabled days', () => {
      expect(next(timesPerDay(3, days('tu')), '2026-07-07 10:01', dayBoundaries)).toBe('2026-07-07 14:00')
    })

    it('rolls over to the next enabled day after the last slot', () => {
      expect(next(timesPerDay(2, days('mo', 'th')), `${MONDAY_DATE} 17:01`, dayBoundaries)).toBe('2026-07-09 11:00')
    })

    it('treats all days enabled the same as no restriction', () => {
      expect(next(timesPerDay(3, days(...WEEKDAYS)), `${MONDAY_DATE} 06:00`, dayBoundaries))
        .toBe(next(timesPerDay(3), `${MONDAY_DATE} 06:00`, dayBoundaries))
    })

    it('attributes a span crossing midnight to the day its middle falls on', () => {
      const boundaries = { start: time(22, 0), end: time(6, 0) }
      expect(next(timesPerDay(1, days('mo')), `${MONDAY_DATE} 12:00`, boundaries)).toBe('2026-07-13 02:00')
    })

    it('throws a RangeError when no days are enabled', () => {
      expect(() => next(timesPerDay(1, days()), `${MONDAY_DATE} 06:00`, dayBoundaries)).toThrow(RangeError)
    })
  })
})

describe('current slot', () => {
  const currentSlot = (
    recurrence: Parameters<typeof getOccurrence['currentSlot']>[0],
    referenceDate: string,
    boundaries: Parameters<typeof getOccurrence['currentSlot']>[2] = dayBoundaries,
  ) => {
    const slot = getOccurrence.currentSlot(recurrence, dayjs(referenceDate), boundaries)
    if (!slot) return undefined
    return [slot.opensAt, slot.dueAt, slot.closesAt].map(date => date.format('YYYY-MM-DD HH:mm')).join(' → ')
  }

  it('runs the same recurrence value validation', () => {
    expect(() => currentSlot(timesPerDay(0), `${MONDAY_DATE} 14:00`)).toThrow(RangeError)
  })

  it('spans the whole day time span for a single daily occurrence', () => {
    expect(currentSlot(timesPerDay(1), `${MONDAY_DATE} 09:00`))
      .toBe(`${MONDAY_DATE} 08:00 → ${MONDAY_DATE} 14:00 → ${MONDAY_DATE} 20:00`)
  })

  it('returns the slot the reference date falls into', () => {
    expect(currentSlot(timesPerDay(3), `${MONDAY_DATE} 13:00`))
      .toBe(`${MONDAY_DATE} 12:00 → ${MONDAY_DATE} 14:00 → ${MONDAY_DATE} 16:00`)
  })

  it('opens the first slot at the start of the day time span', () => {
    expect(currentSlot(timesPerDay(3), `${MONDAY_DATE} 08:00`))
      .toBe(`${MONDAY_DATE} 08:00 → ${MONDAY_DATE} 10:00 → ${MONDAY_DATE} 12:00`)
  })

  it('closes the last slot at the close of the day time span', () => {
    expect(currentSlot(timesPerDay(3), `${MONDAY_DATE} 19:00`))
      .toBe(`${MONDAY_DATE} 16:00 → ${MONDAY_DATE} 18:00 → ${MONDAY_DATE} 20:00`)
  })

  it('counts the closing instant as still inside the last slot', () => {
    expect(currentSlot(timesPerDay(3), `${MONDAY_DATE} 20:00`))
      .toBe(`${MONDAY_DATE} 16:00 → ${MONDAY_DATE} 18:00 → ${MONDAY_DATE} 20:00`)
  })

  it('returns nothing in the quiet gap after the day time span', () => {
    expect(currentSlot(timesPerDay(3), `${MONDAY_DATE} 20:01`)).toBeUndefined()
  })

  it('returns nothing in the quiet gap before the day time span', () => {
    expect(currentSlot(timesPerDay(3), `${MONDAY_DATE} 07:59`)).toBeUndefined()
  })

  it('returns nothing on a day the recurrence does not run', () => {
    expect(currentSlot(timesPerDay(1, days('tu')), `${MONDAY_DATE} 14:00`)).toBeUndefined()
  })

  it('carries a slot across midnight', () => {
    const boundaries = { start: time(22, 0), end: time(6, 0) }
    expect(currentSlot(timesPerDay(1), '2026-07-07 03:00', boundaries))
      .toBe(`${MONDAY_DATE} 22:00 → 2026-07-07 02:00 → 2026-07-07 06:00`)
  })
})

describe('previous occurrence', () => {
  it('runs the same recurrence value validation', () => {
    expect(() => previous(timesPerDay(0), `${MONDAY_DATE} 06:00`, dayBoundaries)).toThrow(RangeError)
  })

  describe('once a day', () => {
    it('places the occurrence in the middle of the day boundaries', () => {
      expect(previous(timesPerDay(1), `${MONDAY_DATE} 22:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 14:00`)
    })

    it('returns an occurrence lying exactly at referenceDate', () => {
      expect(previous(timesPerDay(1), `${MONDAY_DATE} 14:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 14:00`)
    })

    it('moves to the previous day while the occurrence is still ahead', () => {
      expect(previous(timesPerDay(1), `${MONDAY_DATE} 13:59`, dayBoundaries)).toBe('2026-07-05 14:00')
    })

    it('accounts for minutes in the boundaries', () => {
      const boundaries = { start: time(8, 30), end: time(21, 30) }
      expect(previous(timesPerDay(1), `${MONDAY_DATE} 23:00`, boundaries)).toBe(`${MONDAY_DATE} 15:00`)
    })
  })

  describe('several times a day', () => {
    it('returns the last slot when starting after the day time span', () => {
      expect(previous(timesPerDay(3), `${MONDAY_DATE} 22:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 18:00`)
    })

    it('returns the last slot when starting inside the span but past it', () => {
      expect(previous(timesPerDay(3), `${MONDAY_DATE} 19:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 18:00`)
    })

    it('returns the previous slot when starting between slots', () => {
      expect(previous(timesPerDay(3), `${MONDAY_DATE} 13:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 10:00`)
    })

    it('returns a slot lying exactly at referenceDate', () => {
      expect(previous(timesPerDay(3), `${MONDAY_DATE} 14:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 14:00`)
    })

    it('stays on the preceding slot right before the following one', () => {
      expect(previous(timesPerDay(3), `${MONDAY_DATE} 13:59`, dayBoundaries)).toBe(`${MONDAY_DATE} 10:00`)
    })

    it('rolls back to the previous day before the first slot, still inside the day time span', () => {
      expect(previous(timesPerDay(3), `${MONDAY_DATE} 09:59`, dayBoundaries)).toBe('2026-07-05 18:00')
    })

    it('centers two daily occurrences in their halves of the span, off the boundaries', () => {
      expect(previous(timesPerDay(2), `${MONDAY_DATE} 22:00`, dayBoundaries)).toBe(`${MONDAY_DATE} 17:00`)
      expect(previous(timesPerDay(2), `${MONDAY_DATE} 16:59`, dayBoundaries)).toBe(`${MONDAY_DATE} 11:00`)
    })

    it('supports slots not divisible into whole minutes', () => {
      // 12h span / 7 slots ≈ 102.86 min, so the second slot lands at 10:34:17
      expect(previous(timesPerDay(7), `${MONDAY_DATE} 10:35`, dayBoundaries)).toBe(`${MONDAY_DATE} 10:34`)
    })

    it('does not lose the last slot to float rounding of a fractional slot length', () => {
      // 302 min span / 8 slots = 37.75 min: the last occurrence sits at 12:43:07, and clamping the
      // slot index (not the minutes) is what keeps a reference past it from floating away
      const boundaries = { start: time(8, 0), end: time(13, 2) }
      expect(previous(timesPerDay(8), `${MONDAY_DATE} 14:00`, boundaries)).toBe(`${MONDAY_DATE} 12:43`)
    })

    it('returns an occurrence at a fractional second lying exactly at referenceDate', () => {
      // 37.75 min slots put occurrence 8 at 12:43:07.5. Measuring the reference in whole minutes
      // rounds it back below that instant, which answers with the occurrence before it.
      const boundaries = { start: time(8, 0), end: time(13, 2) }
      expect(previous(timesPerDay(8), `${MONDAY_DATE} 12:43:07.500`, boundaries)).toBe(`${MONDAY_DATE} 12:43`)
    })
  })

  describe('day boundaries across midnight', () => {
    const boundaries = { start: time(22, 0), end: time(6, 0) }

    it('places a single occurrence past midnight when the middle of the span falls there', () => {
      expect(previous(timesPerDay(1), '2026-07-07 12:00', boundaries)).toBe('2026-07-07 02:00')
    })

    it('finds the late-evening slot when starting inside the span before midnight', () => {
      expect(previous(timesPerDay(3), `${MONDAY_DATE} 23:30`, boundaries)).toBe(`${MONDAY_DATE} 23:20`)
    })

    it('finds the past-midnight slot when starting inside the span past midnight', () => {
      expect(previous(timesPerDay(3), '2026-07-07 03:00', boundaries)).toBe('2026-07-07 02:00')
    })
  })

  describe('restricting to specific days', () => {
    it('returns the same-day occurrence when the day is enabled', () => {
      expect(previous(timesPerDay(1, days('mo', 'we', 'fr')), `${MONDAY_DATE} 15:00`, dayBoundaries))
        .toBe(`${MONDAY_DATE} 14:00`)
    })

    it('skips disabled weekdays', () => {
      expect(previous(timesPerDay(1, days('mo', 'we', 'fr')), '2026-07-08 13:00', dayBoundaries))
        .toBe(`${MONDAY_DATE} 14:00`)
    })

    it('reaches back a whole week when only one day is enabled', () => {
      expect(previous(timesPerDay(1, days('mo')), `${MONDAY_DATE} 13:00`, dayBoundaries)).toBe('2026-06-29 14:00')
    })

    it('falls back to the closest enabled day when referenceDate falls on a disabled day', () => {
      expect(previous(timesPerDay(1, days('su')), '2026-07-11 06:00', dayBoundaries)).toBe('2026-07-05 14:00')
    })

    it('keeps the intra-day spread on enabled days', () => {
      expect(previous(timesPerDay(3, days('tu')), '2026-07-07 17:59', dayBoundaries)).toBe('2026-07-07 14:00')
    })

    it('rolls back to the previous enabled day before the first slot', () => {
      expect(previous(timesPerDay(2, days('mo', 'th')), '2026-07-09 10:59', dayBoundaries)).toBe(`${MONDAY_DATE} 17:00`)
    })

    it('treats all days enabled the same as no restriction', () => {
      expect(previous(timesPerDay(3, days(...WEEKDAYS)), `${MONDAY_DATE} 22:00`, dayBoundaries))
        .toBe(previous(timesPerDay(3), `${MONDAY_DATE} 22:00`, dayBoundaries))
    })

    it('attributes a span crossing midnight to the day its middle falls on', () => {
      const boundaries = { start: time(22, 0), end: time(6, 0) }
      expect(previous(timesPerDay(1, days('mo')), `${MONDAY_DATE} 12:00`, boundaries)).toBe(`${MONDAY_DATE} 02:00`)
    })

    it('throws a RangeError when no days are enabled', () => {
      expect(() => previous(timesPerDay(1, days()), `${MONDAY_DATE} 06:00`, dayBoundaries)).toThrow(RangeError)
    })
  })
})
