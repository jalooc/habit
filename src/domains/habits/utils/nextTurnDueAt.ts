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

// The next due moment that isn't already served: a turn completed anywhere inside itself is done,
// so the answer steps over it rather than announcing it again.
//
// Always in the future, which is why callers can schedule on it. Note what that costs: a turn past
// due and unserved is *not* the answer, since the rotation is already behind and there is nothing
// left to announce — ask `isGroupDue` for that. So this is "the next turn to look forward to", not
// "the earliest turn still owed".
const nextTurnDueAt = ({ recurrence, lastServedAt, now, dayBoundaries }: Params): Dayjs | undefined => {
  const currentTurn = getOccurrence.currentSlot(recurrence, now, dayBoundaries)
  const isCurrentTurnServed = currentTurn && hasCompletedSinceTurnOpened(currentTurn, lastServedAt)

  return getOccurrence.next(
    recurrence,
    isCurrentTurnServed ? currentTurn.closesAt : now,
    dayBoundaries,
  )
}

export default nextTurnDueAt
