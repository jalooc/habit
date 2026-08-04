import { Dayjs } from 'dayjs'

import { Recurrence } from 'src/domains/recurrence/utils/recurrence'
import getOccurrence from 'src/domains/recurrence/utils/getOccurrence'
import { isBehind } from 'src/domains/habits/utils/isGroupDue'

type Params = {
  recurrence: Recurrence,
  lastCompletedMs: number | undefined,
  now: Dayjs,
  dayBoundaries: Parameters<typeof getOccurrence['next']>[2],
}

// When the rotation's next unserved turn comes due. A turn completed anywhere inside itself is
// served, so the answer skips past it instead of announcing a turn that is done.
const nextTurnDueAt = ({ recurrence, lastCompletedMs, now, dayBoundaries }: Params): Dayjs | undefined => {
  const currentTurn = getOccurrence.currentSlot(recurrence, now, dayBoundaries)
  const isCurrentTurnServed = currentTurn && !isBehind(lastCompletedMs, currentTurn.opensAt.valueOf())

  return getOccurrence.next(
    recurrence,
    isCurrentTurnServed ? currentTurn.closesAt : now,
    dayBoundaries,
  )
}

export default nextTurnDueAt
