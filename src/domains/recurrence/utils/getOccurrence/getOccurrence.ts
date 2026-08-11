import { Recurrence, RecurrenceType } from 'src/domains/recurrence/utils/recurrence'
import { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { entries, isTruthy } from 'remeda'

import { areDayBoundariesAcrossMidnight, areDayBoundariesZeroDuration } from './dayBoundaries'
import {
  clampToActiveHours,
  DayBoundaries,
  isWithinActiveHours,
  preserveWallClockAddDays,
  slotFromDueAt,
  snapToSpecificDays,
  Time,
} from './intervalHelpers'

/*
  Occurrence vs slot — two words for two different kinds of thing:

  - An *occurrence* is an **instant**: the moment the recurrence fires. `next`/`previous` return
    occurrences.
  - A *slot* is the **interval** that instant sits in: one of the `value` equal parts the active
    span is divided into. `currentSlot` returns one as `{ opensAt, dueAt, closesAt }`.

  They map one to one: every slot has exactly one occurrence, its `dueAt`, and `next`/`previous`
  are just "the `dueAt` of the slot after / at-or-before this moment" — which is how they are
  implemented: one slot definition, read three ways. Both words are needed because "when does it
  fire" and "which stretch of time does that firing govern" are different questions.

  `times-per-day` is calendar-anchored and ignores `lastServedAt`. Interval types (`every-x-days`,
  …) anchor slots on rotation service history instead.
*/

const MAX_SEARCH_HORIZON_IN_DAYS = 30

const atWallClock = (day: Dayjs, time: Time) => day.startOf('day').hour(time.hour).minute(time.minute)

// Keep in sync with the drivers below — every type missing here throws when asked for an occurrence.
const IMPLEMENTED_RECURRENCE_TYPES = new Set<RecurrenceType>(['times-per-day', 'every-x-days'])

export const isRecurrenceTypeImplemented = (type: RecurrenceType) => IMPLEMENTED_RECURRENCE_TYPES.has(type)

export type OccurrenceSlot = {
  opensAt: Dayjs,
  dueAt: Dayjs,
  closesAt: Dayjs,
}

// A day time span is attributed to the weekday its middle falls on, so a span crossing midnight
// goes to whichever side holds the larger part of it: 22:00–06:00 belongs to the day it ends in,
// 20:00–02:00 to the day it starts in.
const matchesSpecificDays = (specificDays: Recurrence['specificDays'], dayTimeSpanMiddle: Dayjs) => {
  if (!specificDays) return true

  const weekday = dayTimeSpanMiddle.format('dd').toLowerCase()
  return entries(specificDays).some(([day, isEnabled]) => isEnabled && day === weekday)
}

const validateRecurrence = (
  recurrence: Recurrence,
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
  if (areDayBoundariesZeroDuration(dayBoundaries)) {
    throw new RangeError('Day boundaries can\'t be zero-duration.')
  }
}

const timesPerDayDriver = (
  recurrence: Recurrence,
  referenceDate: Dayjs,
  dayBoundaries: DayBoundaries,
) => {
  const isAcrossMidnight = areDayBoundariesAcrossMidnight(dayBoundaries)
  const timesPerDay = recurrence.value
  const { specificDays } = recurrence

  const spanClosingAt = (closesAt: Dayjs) => {
    const opensAt = atWallClock(isAcrossMidnight ? closesAt.subtract(1, 'day') : closesAt, dayBoundaries.start)

    return { opensAt, closesAt, lengthInMinutes: closesAt.diff(opensAt, 'minutes', true) }
  }

  type Span = ReturnType<typeof spanClosingAt>

  const slotEdgeAt = (span: Span, slotsFromOpening: number) =>
    span.opensAt.add(slotsFromOpening * (span.lengthInMinutes / timesPerDay), 'minutes')

  const occurrenceAt = (span: Span, index: number) => slotEdgeAt(span, index + 0.5)

  const slotAt = (span: Span, index: number) => ({
    opensAt: slotEdgeAt(span, index),
    dueAt: occurrenceAt(span, index),
    closesAt: slotEdgeAt(span, index + 1),
  })

  const slotIndexes = Array.from({ length: timesPerDay }, (_, index) => index)

  const runsOn = (span: Span) =>
    matchesSpecificDays(specificDays, span.opensAt.add(span.lengthInMinutes / 2, 'minutes'))

  const sameDayCloses = atWallClock(referenceDate, dayBoundaries.end)
  const firstSpan = spanClosingAt(
    sameDayCloses.isBefore(referenceDate) ? sameDayCloses.add(1, 'day') : sameDayCloses
  )

  const spanAt = (dayOffset: number) => {
    if (dayOffset === 0) return firstSpan

    const opensAt = firstSpan.opensAt.add(dayOffset, 'day')
    const closesAt = firstSpan.closesAt.add(dayOffset, 'day')

    return { opensAt, closesAt, lengthInMinutes: closesAt.diff(opensAt, 'minutes', true) }
  }

  const search = (
    dayOffset: number,
    step: 1 | -1,
    pickFrom: (span: Span) => Dayjs | undefined,
  ): Dayjs | undefined => {
    if (Math.abs(dayOffset) >= MAX_SEARCH_HORIZON_IN_DAYS) return undefined

    const span = spanAt(dayOffset)
    const occurrence = runsOn(span) ? pickFrom(span) : undefined

    return occurrence ?? search(dayOffset + step, step, pickFrom)
  }

  const occurrenceIn = (span: Span, index: number | undefined) =>
    index === undefined ? undefined : occurrenceAt(span, index)

  return {
    next: () => search(0, 1, span => occurrenceIn(
      span,
      slotIndexes.find(index => !occurrenceAt(span, index).isBefore(referenceDate)),
    )),
    previous: () => search(0, -1, span => occurrenceIn(
      span,
      slotIndexes.findLast(index => !occurrenceAt(span, index).isAfter(referenceDate)),
    )),
    currentSlot: () => {
      const span = firstSpan
      if (referenceDate.isBefore(span.opensAt)) return undefined
      if (!runsOn(span)) return undefined

      const index = slotIndexes.find(i => referenceDate.isBefore(slotEdgeAt(span, i + 1)))

      return slotAt(span, index ?? timesPerDay - 1)
    },
  }
}

const everyXDaysDriver = (
  recurrence: Recurrence,
  referenceDate: Dayjs,
  dayBoundaries: DayBoundaries,
  lastServedAt: number | null,
) => {
  const intervalDays = recurrence.value
  const { specificDays } = recurrence

  const bootstrapDueAt = (reference: Dayjs) => {
    const snapped = snapToSpecificDays(reference, specificDays)
    const dayStart = atWallClock(snapped, dayBoundaries.start)
    const clamped = clampToActiveHours(snapped, dayBoundaries)

    return clamped.isAfter(dayStart) ? dayStart : clamped
  }

  const dueAfterServe = (servedAt: number) =>
    snapToSpecificDays(preserveWallClockAddDays(dayjs(servedAt), intervalDays), specificDays)

  const advanceDueAt = (dueAt: Dayjs) =>
    snapToSpecificDays(preserveWallClockAddDays(dueAt, intervalDays), specificDays)

  const slotForDueAt = (dueAt: Dayjs): OccurrenceSlot => slotFromDueAt(dueAt, intervalDays)

  const slotAfterServe = (servedAt: number): OccurrenceSlot => {
    const dueAt = dueAfterServe(servedAt)

    return {
      opensAt: dayjs(servedAt),
      dueAt,
      closesAt: preserveWallClockAddDays(dueAt, intervalDays / 2),
    }
  }

  const duesNear = () => {
    if (lastServedAt === null) return [bootstrapDueAt(referenceDate)]

    const dues = [dueAfterServe(lastServedAt)]
    for (let step = 1; step <= MAX_SEARCH_HORIZON_IN_DAYS; step += 1) {
      dues.unshift(snapToSpecificDays(preserveWallClockAddDays(dues[0], -intervalDays), specificDays))
      const lastDue = dues.at(-1)
      if (!lastDue) break
      dues.push(advanceDueAt(lastDue))
    }
    return dues
  }

  const slotContaining = (): OccurrenceSlot | undefined => {
    if (!isWithinActiveHours(referenceDate, dayBoundaries)) return undefined

    if (lastServedAt !== null) {
      const servedSlot = slotAfterServe(lastServedAt)
      if (!referenceDate.isBefore(servedSlot.opensAt) && !referenceDate.isAfter(servedSlot.closesAt)) {
        return servedSlot
      }

      if (!referenceDate.isBefore(servedSlot.closesAt)) {
        let due = advanceDueAt(servedSlot.dueAt)
        while (due.isBefore(referenceDate)) due = advanceDueAt(due)

        const forwardSlot = slotForDueAt(due)
        if (!referenceDate.isBefore(forwardSlot.opensAt) && !referenceDate.isAfter(forwardSlot.closesAt)) {
          return forwardSlot
        }
      }
    }

    const bootstrap = bootstrapDueAt(referenceDate)
    const bootstrapSlot = slotForDueAt(bootstrap)
    if (!referenceDate.isBefore(bootstrapSlot.opensAt) && !referenceDate.isAfter(bootstrapSlot.closesAt)) {
      return bootstrapSlot
    }

    return duesNear().map(slotForDueAt).find(slot =>
      !referenceDate.isBefore(slot.opensAt) && !referenceDate.isAfter(slot.closesAt))
  }

  return {
    next: () => {
      if (lastServedAt === null) {
        const bootstrap = bootstrapDueAt(referenceDate)
        return bootstrap.isBefore(referenceDate) ? undefined : bootstrap
      }

      let due = dueAfterServe(lastServedAt)
      while (due.isBefore(referenceDate)) due = advanceDueAt(due)
      return due
    },
    previous: () => {
      if (lastServedAt === null) {
        const bootstrap = bootstrapDueAt(referenceDate)
        return bootstrap.isAfter(referenceDate) ? undefined : bootstrap
      }

      let due = dueAfterServe(lastServedAt)
      let nextDue = advanceDueAt(due)

      while (!nextDue.isAfter(referenceDate)) {
        due = nextDue
        nextDue = advanceDueAt(due)
      }

      return due.isAfter(referenceDate) ? undefined : due
    },
    currentSlot: () => slotContaining(),
  }
}

const drivers = (
  recurrence: Recurrence,
  referenceDate: Dayjs,
  dayBoundaries: DayBoundaries,
  lastServedAt: number | null | undefined,
) => {
  validateRecurrence(recurrence, dayBoundaries)

  if (recurrence.type !== 'times-per-day' && lastServedAt === undefined) {
    throw new TypeError(`lastServedAt is required for ${recurrence.type}.`)
  }

  return ({
    'times-per-day': () => timesPerDayDriver(recurrence, referenceDate, dayBoundaries),
    'every-x-hours': () => {
      throw new Error('every-x-hours is not implemented.')
    },
    'every-x-days': () => everyXDaysDriver(recurrence, referenceDate, dayBoundaries, lastServedAt ?? null),
    'times-per-week': () => {
      throw new Error('times-per-week is not implemented.')
    },
    'times-per-month': () => {
      throw new Error('times-per-month is not implemented.')
    },
  }[recurrence.type])()
}

type TimesPerDayRecurrence = Recurrence & { type: 'times-per-day' }

const isTimesPerDay = (recurrence: Recurrence): recurrence is TimesPerDayRecurrence =>
  recurrence.type === 'times-per-day'

const lastServedAtForDriver = (recurrence: Recurrence, lastServedAt?: number | null) =>
  isTimesPerDay(recurrence) ? undefined : lastServedAt

type OccurrenceNext = {
  (recurrence: TimesPerDayRecurrence, referenceDate: Dayjs, dayBoundaries: DayBoundaries): Dayjs | undefined,
  (
    recurrence: Recurrence,
    referenceDate: Dayjs,
    dayBoundaries: DayBoundaries,
    lastServedAt: number | null,
  ): Dayjs | undefined,
}

type OccurrencePrevious = {
  (recurrence: TimesPerDayRecurrence, referenceDate: Dayjs, dayBoundaries: DayBoundaries): Dayjs | undefined,
  (
    recurrence: Recurrence,
    referenceDate: Dayjs,
    dayBoundaries: DayBoundaries,
    lastServedAt: number | null,
  ): Dayjs | undefined,
}

type OccurrenceCurrentSlot = {
  (
    recurrence: TimesPerDayRecurrence,
    referenceDate: Dayjs,
    dayBoundaries: DayBoundaries,
  ): OccurrenceSlot | undefined,
  (
    recurrence: Recurrence,
    referenceDate: Dayjs,
    dayBoundaries: DayBoundaries,
    lastServedAt: number | null,
  ): OccurrenceSlot | undefined,
}

const next: OccurrenceNext = (
  recurrence: Recurrence,
  referenceDate: Dayjs,
  dayBoundaries: DayBoundaries,
  lastServedAt?: number | null,
) => drivers(recurrence, referenceDate, dayBoundaries, lastServedAtForDriver(recurrence, lastServedAt)).next()

const previous: OccurrencePrevious = (
  recurrence: Recurrence,
  referenceDate: Dayjs,
  dayBoundaries: DayBoundaries,
  lastServedAt?: number | null,
) => drivers(recurrence, referenceDate, dayBoundaries, lastServedAtForDriver(recurrence, lastServedAt)).previous()

const currentSlot: OccurrenceCurrentSlot = (
  recurrence: Recurrence,
  referenceDate: Dayjs,
  dayBoundaries: DayBoundaries,
  lastServedAt?: number | null,
) => drivers(recurrence, referenceDate, dayBoundaries, lastServedAtForDriver(recurrence, lastServedAt)).currentSlot()

export default {
  next,
  previous,
  currentSlot,
}
