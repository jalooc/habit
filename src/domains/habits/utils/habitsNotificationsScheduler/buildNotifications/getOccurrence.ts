import { Recurrence } from 'src/domains/habits/screens/EditSchedule/recurrence'
import dayjs, { Dayjs } from 'dayjs'
import { entries, filter, isTruthy, map, pipe } from 'remeda'
import isBetween from 'dayjs/plugin/isBetween'

import { DayBoundaries } from './types'
import calcDayTimeSpan from './calcDayTimeSpan'

dayjs.extend(isBetween)

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
      const getOccurrence = (
        calcNextIterationIndex: (currentIndex: number) => number,
        calcIntervalsCountFromDayTimeStartToOccurrence: (
          dayTimeStartDate: Dayjs,
          intervalLength: number,
          intervalsCount: number,
        ) => number,
        respectsReferenceDate: (closestOccurrenceContender: Dayjs) => boolean
      ) => {
        const {
          dayTimeSpan,
          endMinutes,
        } = calcDayTimeSpan(dayBoundaries)
        const { specificDays } = recurrence
        const timesPerDay = recurrence.value

        const sameDayEndDate = referenceDate.startOf('day').add(endMinutes, 'minutes')
        const firstDayTimeEndDate = sameDayEndDate.isBefore(referenceDate) ?
          sameDayEndDate.add(1, 'day') :
          sameDayEndDate

        const maxSearchHorizonInDays = 30
        let i = 0
        while (Math.abs(i) < maxSearchHorizonInDays) {
          const dayTimeEndDate = firstDayTimeEndDate.add(i, 'day')
          const dayTimeStartDate = dayTimeEndDate.subtract(dayTimeSpan, 'minutes')
          const dayTimeSpanMiddle = dayTimeStartDate.add(dayTimeSpan / 2, 'minutes')
          const dayTimeSpanMainDayWeekday = dayTimeSpanMiddle.format('dd').toLowerCase()

          let closestOccurrenceContender: Dayjs

          if (timesPerDay === 1) {
            closestOccurrenceContender = dayTimeStartDate.add(dayTimeSpan / 2, 'minutes')
          } else {
            const intervalsCount = timesPerDay - 1
            const intervalLength = dayTimeSpan / intervalsCount
            const intervalsCountFromDayTimeStartToClosestOccurrence = calcIntervalsCountFromDayTimeStartToOccurrence(
              dayTimeStartDate,
              intervalLength,
              intervalsCount,
            )
            const minutesFromDayTimeStartToClosestOccurrence =
              intervalsCountFromDayTimeStartToClosestOccurrence * intervalLength
            closestOccurrenceContender = dayTimeStartDate.add(minutesFromDayTimeStartToClosestOccurrence, 'minutes')
          }

          const isWithinDayTimeSpan = closestOccurrenceContender.isBetween(dayTimeStartDate, dayTimeEndDate, undefined, '[]')
          const matchesSpecificDays = !specificDays ||
            pipe(
              specificDays,
              entries(),
              filter(([, value]) => value),
              map(([key]) => key)
            ).includes(dayTimeSpanMainDayWeekday as never)
          if (isWithinDayTimeSpan && respectsReferenceDate(closestOccurrenceContender) && matchesSpecificDays) {
            return closestOccurrenceContender
          }

          i = calcNextIterationIndex(i)
        }

      }

      return {
        next: () => getOccurrence(
          i => i + 1,
          (dayTimeStartDate, intervalLength) => Math.ceil(
            Math.max(referenceDate.diff(dayTimeStartDate, 'minutes'), 0) / intervalLength
          ),
          closestOccurrenceContender => !closestOccurrenceContender.isBefore(referenceDate)
        ),
        previous: () => getOccurrence(
          i => i - 1,
          (dayTimeStartDate, intervalLength, intervalsCount) => Math.min(
            Math.floor(referenceDate.diff(dayTimeStartDate, 'minutes') / intervalLength),
            intervalsCount
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
