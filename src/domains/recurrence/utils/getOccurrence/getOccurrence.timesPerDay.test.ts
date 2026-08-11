import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { objectFromEntries } from 'tsafe'
import { Weekday, WEEKDAYS } from 'src/domains/recurrence/utils/recurrence'

import getOccurrence from './getOccurrence'

const MONDAY_DATE = '2026-07-06'

const time = (hour: number, minute: number) => ({ hour, minute })

const timesPerDay = (value: number, specificDays?: Record<Weekday, boolean>) =>
  ({ type: 'times-per-day', value, specificDays } as const)

const days = (...selected: Weekday[]) =>
  objectFromEntries(WEEKDAYS.map(day => [day, selected.includes(day)]))

const dayBoundaries = { start: time(8, 0), end: time(20, 0) }

const next = (recurrence: ReturnType<typeof timesPerDay>, referenceDate: string, boundaries = dayBoundaries) => {
  const occurrence = getOccurrence.next(recurrence, dayjs(referenceDate), boundaries)
  if (!occurrence) throw new Error('Expected an occurrence')
  return occurrence.format('YYYY-MM-DD HH:mm')
}

const previous = (recurrence: ReturnType<typeof timesPerDay>, referenceDate: string, boundaries = dayBoundaries) => {
  const occurrence = getOccurrence.previous(recurrence, dayjs(referenceDate), boundaries)
  if (!occurrence) throw new Error('Expected an occurrence')
  return occurrence.format('YYYY-MM-DD HH:mm')
}

const currentSlot = (recurrence: ReturnType<typeof timesPerDay>, referenceDate: string, boundaries = dayBoundaries) => {
  const slot = getOccurrence.currentSlot(recurrence, dayjs(referenceDate), boundaries)
  if (!slot) return undefined
  return [slot.opensAt, slot.dueAt, slot.closesAt].map(date => date.format('YYYY-MM-DD HH:mm')).join(' → ')
}

// Blackbox golden cases for times-per-day — only the exported getOccurrence API.
describe('getOccurrence times-per-day', () => {
  describe('next', () => {
    it('places a single daily occurrence at the span midpoint', () => {
      expect(next(timesPerDay(1), `${MONDAY_DATE} 06:00`)).toBe(`${MONDAY_DATE} 14:00`)
    })

    it('steps through three intra-day occurrences', () => {
      expect(next(timesPerDay(3), `${MONDAY_DATE} 06:00`)).toBe(`${MONDAY_DATE} 10:00`)
      expect(next(timesPerDay(3), `${MONDAY_DATE} 11:00`)).toBe(`${MONDAY_DATE} 14:00`)
      expect(next(timesPerDay(3), `${MONDAY_DATE} 14:01`)).toBe(`${MONDAY_DATE} 18:00`)
    })

    it('does not round sub-minute references back onto a passed occurrence', () => {
      expect(next(timesPerDay(3), `${MONDAY_DATE} 14:00:30`)).toBe(`${MONDAY_DATE} 18:00`)
    })

    it('skips disabled weekdays', () => {
      expect(next(timesPerDay(1, days('mo', 'we', 'fr')), `${MONDAY_DATE} 15:00`)).toBe('2026-07-08 14:00')
    })

    it('finds a past-midnight occurrence inside an overnight span', () => {
      const boundaries = { start: time(22, 0), end: time(6, 0) }
      expect(next(timesPerDay(3), `${MONDAY_DATE} 23:30`, boundaries)).toBe('2026-07-07 02:00')
    })
  })

  describe('previous', () => {
    it('returns the last same-day occurrence after active hours', () => {
      expect(previous(timesPerDay(3), `${MONDAY_DATE} 22:00`)).toBe(`${MONDAY_DATE} 18:00`)
    })

    it('steps back between intra-day occurrences', () => {
      expect(previous(timesPerDay(3), `${MONDAY_DATE} 13:00`)).toBe(`${MONDAY_DATE} 10:00`)
    })
  })

  describe('currentSlot', () => {
    it('spans the whole day for a single daily occurrence', () => {
      expect(currentSlot(timesPerDay(1), `${MONDAY_DATE} 09:00`))
        .toBe(`${MONDAY_DATE} 08:00 → ${MONDAY_DATE} 14:00 → ${MONDAY_DATE} 20:00`)
    })

    it('returns nothing in the quiet gap before active hours', () => {
      expect(currentSlot(timesPerDay(3), `${MONDAY_DATE} 07:59`)).toBeUndefined()
    })

    it('returns nothing in the quiet gap after active hours', () => {
      expect(currentSlot(timesPerDay(3), `${MONDAY_DATE} 20:01`)).toBeUndefined()
    })
  })

  describe('daylight saving transitions', () => {
    it('keeps wall-clock active hours on a spring-forward day', () => {
      expect(next(timesPerDay(1), '2026-03-29 06:00')).toBe('2026-03-29 14:00')
    })
  })
})
