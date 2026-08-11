import { Dayjs } from 'dayjs'

import { Recurrence } from 'src/domains/recurrence/utils/recurrence'
import getOccurrence from 'src/domains/recurrence/utils/getOccurrence'
import hasCompletedSinceTurnOpened from 'src/domains/habits/utils/hasCompletedSinceTurnOpened'

type Params = {
  recurrence: Recurrence,
  lastServedAt: number | null,
  now: Dayjs,
  dayBoundaries: Parameters<typeof getOccurrence['next']>[2],
}

const nextTurnDueAt = ({ recurrence, lastServedAt, now, dayBoundaries }: Params): Dayjs | undefined => {
  if (recurrence.type === 'times-per-day') {
    const currentTurn = getOccurrence.currentSlot(recurrence, now, dayBoundaries, lastServedAt)
    const isCurrentTurnServed = currentTurn && hasCompletedSinceTurnOpened(currentTurn, lastServedAt)

    return getOccurrence.next(
      recurrence,
      isCurrentTurnServed ? currentTurn.closesAt : now,
      dayBoundaries,
      lastServedAt,
    )
  }

  return getOccurrence.next(recurrence, now, dayBoundaries, lastServedAt)
}

export default nextTurnDueAt
