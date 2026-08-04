import { Recurrence, RecurrenceType } from 'src/domains/recurrence/utils/recurrence'
import dayjs, { Dayjs } from 'dayjs'
import { entries, isTruthy } from 'remeda'
import isBetween from 'dayjs/plugin/isBetween'

import calcDayTimeSpan from './calcDayTimeSpan'

dayjs.extend(isBetween)

type Time = {
  hour: number, minute: number,
}

type DayBoundaries = {
  start: Time,
  end: Time,
}

// Keep in sync with the drivers below — every type missing here throws when asked for an occurrence.
const IMPLEMENTED_RECURRENCE_TYPES = new Set<RecurrenceType>(['times-per-day'])

export const isRecurrenceTypeImplemented = (type: RecurrenceType) => IMPLEMENTED_RECURRENCE_TYPES.has(type)

// A day time span is attributed to the weekday its middle falls on, so a span crossing midnight
// goes to whichever side holds the larger part of it: 22:00–06:00 belongs to the day it ends in,
// 20:00–02:00 to the day it starts in.
const matchesSpecificDays = (specificDays: Recurrence['specificDays'], dayTimeSpanMiddle: Dayjs) => {
  if (!specificDays) return true

  const weekday = dayTimeSpanMiddle.format('dd').toLowerCase()
  return entries(specificDays).some(([day, isEnabled]) => isEnabled && day === weekday)
}

const drivers = (
  recurrence: Recurrence,
  referenceDate: Dayjs,
  dayBoundaries: DayBoundaries,
) => {
  if (recurrence.value < 1) {
    throw new RangeError('Recurrence value can\'t be lower than 1.')
  }
  if (!Number.isInteger(recurrence.value)) {
    throw new RangeError('Recurrence value must be an integer.')
  }
  if (
    recurrence.specificDays &&
    Object.values(recurrence.specificDays).filter(isTruthy).length === 0
  ) {
    throw new RangeError('At least one specific day has to be picked.')
  }

  return ({
    'times-per-day': () => {
      const { dayTimeSpan, endMinutes } = calcDayTimeSpan(dayBoundaries)
      const { specificDays } = recurrence
      const timesPerDay = recurrence.value
      // The span is split into `timesPerDay` equal slots, each holding its occurrence at its
      // midpoint. Mid-slot rather than on the edges, so no occurrence ever lands on the day's
      // opening or closing minute: one firing the moment active hours end leaves no time to act.
      const slotLength = dayTimeSpan / timesPerDay

      // Day time span ending at or after referenceDate — the one containing it, unless
      // referenceDate sits in the quiet gap between two days' active hours.
      const sameDayEndDate = referenceDate.startOf('day').add(endMinutes, 'minutes')
      const firstDayTimeEndDate = sameDayEndDate.isBefore(referenceDate) ?
        sameDayEndDate.add(1, 'day') :
        sameDayEndDate

      const getOccurrence = (
        calcNextIterationIndex: (currentIndex: number) => number,
        calcSlotIndex: (minutesFromDayTimeStart: number) => number,
        respectsReferenceDate: (closestOccurrenceContender: Dayjs) => boolean
      ) => {
        const maxSearchHorizonInDays = 30
        let i = 0
        while (Math.abs(i) < maxSearchHorizonInDays) {
          const dayTimeEndDate = firstDayTimeEndDate.add(i, 'day')
          const dayTimeStartDate = dayTimeEndDate.subtract(dayTimeSpan, 'minutes')

          const slotIndex = calcSlotIndex(referenceDate.diff(dayTimeStartDate, 'minutes'))
          const closestOccurrenceContender = dayTimeStartDate.add((slotIndex + 0.5) * slotLength, 'minutes')

          const isWithinDayTimeSpan = closestOccurrenceContender.isBetween(dayTimeStartDate, dayTimeEndDate, undefined, '[]')
          if (
            isWithinDayTimeSpan &&
            respectsReferenceDate(closestOccurrenceContender) &&
            matchesSpecificDays(specificDays, dayTimeStartDate.add(dayTimeSpan / 2, 'minutes'))
          ) {
            return closestOccurrenceContender
          }

          i = calcNextIterationIndex(i)
        }

      }

      return {
        next: () => getOccurrence(
          i => i + 1,
          minutesFromDayTimeStart => Math.max(
            Math.ceil(minutesFromDayTimeStart / slotLength - 0.5),
            0
          ),
          closestOccurrenceContender => !closestOccurrenceContender.isBefore(referenceDate)
        ),
        previous: () => getOccurrence(
          i => i - 1,
          minutesFromDayTimeStart => Math.min(
            Math.floor(minutesFromDayTimeStart / slotLength - 0.5),
            timesPerDay - 1
          ),
          closestOccurrenceContender => !closestOccurrenceContender.isAfter(referenceDate)
        ),
      }
    },
    'every-x-hours': () => {
      throw new Error('every-x-hours is not implemented.')
    },
    'every-x-days': () => {
      throw new Error('every-x-days is not implemented.')
    },
    'times-per-week': () => {
      throw new Error('times-per-week is not implemented.')
    },
    'times-per-month': () => {
      throw new Error('times-per-month is not implemented.')
    },
  }[recurrence.type])()
}

export default {
  next: (
    recurrence: Recurrence,
    referenceDate: Dayjs,
    dayBoundaries: DayBoundaries,
  ) => drivers(recurrence, referenceDate, dayBoundaries).next(),
  previous: (
    recurrence: Recurrence,
    referenceDate: Dayjs,
    dayBoundaries: DayBoundaries,
  ) => drivers(recurrence, referenceDate, dayBoundaries).previous(),
}
