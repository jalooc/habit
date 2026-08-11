import { Recurrence } from 'src/domains/recurrence/utils/recurrence'
import { Dayjs } from 'dayjs'
import { entries } from 'remeda'

import { areDayBoundariesAcrossMidnight } from './dayBoundaries'

export type Time = {
  hour: number, minute: number,
}

export type DayBoundaries = {
  start: Time,
  end: Time,
}

export const atWallClock = (day: Dayjs, time: Time) => day.startOf('day').hour(time.hour).minute(time.minute)

const matchesSpecificDays = (specificDays: Recurrence['specificDays'], day: Dayjs) => {
  if (!specificDays) return true

  const weekday = day.format('dd').toLowerCase()
  return entries(specificDays).some(([weekdayKey, isEnabled]) => isEnabled && weekdayKey === weekday)
}

export const snapToSpecificDays = (instant: Dayjs, specificDays: Recurrence['specificDays']) => {
  if (!specificDays) return instant

  const day = instant.startOf('day')
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = day.add(offset, 'day').hour(instant.hour()).minute(instant.minute())
      .second(instant.second()).millisecond(instant.millisecond())
    if (matchesSpecificDays(specificDays, candidate)) return candidate
  }

  throw new RangeError('No enabled day found within a week of the candidate date.')
}

export const clampToActiveHours = (instant: Dayjs, dayBoundaries: DayBoundaries) => {
  const isAcrossMidnight = areDayBoundariesAcrossMidnight(dayBoundaries)
  const dayCloses = atWallClock(instant, dayBoundaries.end)
  const spanCloses = dayCloses.isBefore(instant.startOf('day').add(instant.hour(), 'hour')) ?
    dayCloses.add(1, 'day') :
    dayCloses
  const spanOpens = atWallClock(isAcrossMidnight ? spanCloses.subtract(1, 'day') : spanCloses, dayBoundaries.start)

  if (instant.isBefore(spanOpens)) return spanOpens
  if (instant.isAfter(spanCloses)) return spanCloses
  return instant
}

export const isWithinActiveHours = (instant: Dayjs, dayBoundaries: DayBoundaries) => {
  const clamped = clampToActiveHours(instant, dayBoundaries)
  return clamped.valueOf() === instant.valueOf()
}

export const preserveWallClockAddDays = (anchor: Dayjs, days: number) => anchor.add(days, 'day')

export const slotFromDueAt = (dueAt: Dayjs, intervalDays: number) => ({
  opensAt: preserveWallClockAddDays(dueAt, -intervalDays / 2),
  dueAt,
  closesAt: preserveWallClockAddDays(dueAt, intervalDays / 2),
})
