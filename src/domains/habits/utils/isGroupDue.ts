import { Recurrence } from 'src/domains/recurrence/utils/recurrence'
import getOccurrence from 'src/domains/recurrence/utils/getOccurrence'
import hasCompletedSinceTurnOpened from 'src/domains/habits/utils/hasCompletedSinceTurnOpened'
import { Dayjs } from 'dayjs'

type Params = {
  recurrence: Recurrence | undefined,
  lastServedAt: number | null,
  now: Dayjs,
  dayBoundaries: { start: { hour: number, minute: number }, end: { hour: number, minute: number }},
}

const isGroupDue = ({ recurrence, lastServedAt, now, dayBoundaries }: Params): boolean => {
  if (!recurrence) return false

  if (recurrence.type === 'every-x-days') {
    const turn = getOccurrence.currentSlot(recurrence, now, dayBoundaries, lastServedAt)
    if (!turn) return lastServedAt === null

    return !hasCompletedSinceTurnOpened(turn, lastServedAt)
  }

  const mostRecentOccurrence = getOccurrence.previous(recurrence, now, dayBoundaries, lastServedAt)
  if (!mostRecentOccurrence) return false

  const mostRecentDueTurn = getOccurrence.currentSlot(
    recurrence,
    mostRecentOccurrence,
    dayBoundaries,
    lastServedAt,
  )

  if (!mostRecentDueTurn) {
    return lastServedAt === null || lastServedAt < mostRecentOccurrence.valueOf()
  }

  return !hasCompletedSinceTurnOpened(mostRecentDueTurn, lastServedAt)
}

export default isGroupDue
