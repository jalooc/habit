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

  const mostRecentOccurrence = getOccurrence.previous(recurrence, now, dayBoundaries)
  if (!mostRecentOccurrence) return false

  // Completing anywhere inside a turn serves it, so dueness hangs on when that turn opened,
  // not on when it came due.
  const mostRecentDueTurn = getOccurrence.currentSlot(recurrence, mostRecentOccurrence, dayBoundaries)

  // An occurrence always sits inside a slot, so there is no known input that lands here — the
  // branch exists because the engine's return type is optional and unreachability can't be proved
  // across future changes to it. Falling back to the occurrence degrades to the rule that predates
  // turns: a completion in the first half of a slot stops counting, an error bounded by half a slot
  // length. Both alternatives are worse — a hardcoded boolean is unconditionally wrong in one
  // direction, and throwing crashes the Group screen, which computes dueness during render with no
  // error boundary above it.
  if (!mostRecentDueTurn) {
    return lastServedAt === null || lastServedAt < mostRecentOccurrence.valueOf()
  }

  return !hasCompletedSinceTurnOpened(mostRecentDueTurn, lastServedAt)
}

export default isGroupDue
