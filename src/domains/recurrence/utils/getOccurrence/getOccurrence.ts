import { Recurrence, RecurrenceType } from 'src/domains/recurrence/utils/recurrence'
import { Dayjs } from 'dayjs'
import { entries, isTruthy } from 'remeda'

import calcDayTimeSpan from './calcDayTimeSpan'

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
*/

const MAX_SEARCH_HORIZON_IN_DAYS = 30

type Time = {
  hour: number, minute: number,
}

type DayBoundaries = {
  start: Time,
  end: Time,
}

const atWallClock = (day: Dayjs, time: Time) => day.startOf('day').hour(time.hour).minute(time.minute)

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
      const { startMinutes, endMinutes } = calcDayTimeSpan(dayBoundaries)
      const isAcrossMidnight = startMinutes > endMinutes
      const timesPerDay = recurrence.value
      const { specificDays } = recurrence

      // A day's active span. Both ends are set as wall-clock components, so its length is whatever
      // the clock actually did that day: the night an hour is skipped is genuinely an hour shorter,
      // and the slots divide what is really there rather than a nominal count.
      const spanClosingAt = (closesAt: Dayjs) => {
        const opensAt = atWallClock(isAcrossMidnight ? closesAt.subtract(1, 'day') : closesAt, dayBoundaries.start)

        return { opensAt, closesAt, lengthInMinutes: closesAt.diff(opensAt, 'minutes', true) }
      }

      type Span = ReturnType<typeof spanClosingAt>

      // The one definition of where a slot's edges sit: the span split into `timesPerDay` equal
      // parts. Offsets count whole slots from the span's opening rather than from the previous
      // edge, so a slot length that isn't a whole millisecond is truncated once instead of
      // accumulating: one slot's close is exactly the next one's opening.
      const slotEdgeAt = (span: Span, slotsFromOpening: number) =>
        span.opensAt.add(slotsFromOpening * (span.lengthInMinutes / timesPerDay), 'minutes')

      // Half a slot in is where the occurrence sits — mid-slot rather than on an edge, so none
      // lands on the day's opening or closing minute: one firing the moment active hours end
      // leaves no time to act. Asked for on its own because next/previous need nothing else, and
      // they ask per index.
      const occurrenceAt = (span: Span, index: number) => slotEdgeAt(span, index + 0.5)

      const slotAt = (span: Span, index: number) => ({
        opensAt: slotEdgeAt(span, index),
        dueAt: occurrenceAt(span, index),
        closesAt: slotEdgeAt(span, index + 1),
      })

      const slotIndexes = Array.from({ length: timesPerDay }, (_, index) => index)

      const runsOn = (span: Span) =>
        matchesSpecificDays(specificDays, span.opensAt.add(span.lengthInMinutes / 2, 'minutes'))

      // The span ending at or after referenceDate — the one containing it, unless referenceDate
      // sits in the quiet gap between two days' active hours.
      const sameDayCloses = atWallClock(referenceDate, dayBoundaries.end)
      const firstSpan = spanClosingAt(
        sameDayCloses.isBefore(referenceDate) ? sameDayCloses.add(1, 'day') : sameDayCloses
      )

      // Every other span is the first one stepped whole days, which is cheaper than rebuilding
      // both ends and just as correct: `.add(_, 'day')` holds wall-clock time, so a span landing
      // on a transition still measures the hours that day really has.
      const spanAt = (dayOffset: number) => {
        if (dayOffset === 0) return firstSpan

        const opensAt = firstSpan.opensAt.add(dayOffset, 'day')
        const closesAt = firstSpan.closesAt.add(dayOffset, 'day')

        return { opensAt, closesAt, lengthInMinutes: closesAt.diff(opensAt, 'minutes', true) }
      }

      // Walking day by day rather than jumping to a computed index: a day whose length is not
      // known in advance has no closed-form index, and `.add(_, 'day')` keeps wall-clock time
      // where adding elapsed minutes would drift across a transition.
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

      // Scanning the indexes rather than materialising every slot: the match is usually the first
      // one tried from whichever end the search runs, so the rest are never built.
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

          // The closing instant belongs to the last slot, which is what the fallback covers.
          const index = slotIndexes.find(i => referenceDate.isBefore(slotEdgeAt(span, i + 1)))

          return slotAt(span, index ?? timesPerDay - 1)
        },
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
  // The slot referenceDate falls into: when it opened, when its occurrence lands and when it
  // closes (the next slot's opening, or the day's close for the last one). Undefined outside
  // active hours and on days the recurrence doesn't run.
  currentSlot: (
    recurrence: Recurrence,
    referenceDate: Dayjs,
    dayBoundaries: DayBoundaries,
  ) => drivers(recurrence, referenceDate, dayBoundaries).currentSlot(),
}
