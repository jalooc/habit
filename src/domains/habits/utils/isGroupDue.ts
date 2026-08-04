import { Recurrence } from 'src/domains/recurrence/utils/recurrence'
import getOccurrence from 'src/domains/recurrence/utils/getOccurrence'
import { Dayjs } from 'dayjs'

// Never having completed anything counts as behind.
export const isBehind = (lastCompletedMs: number | undefined, thresholdMs: number): boolean =>
  lastCompletedMs === undefined || lastCompletedMs < thresholdMs

type Params = {
  recurrence: Recurrence | undefined,
  lastCompletedMs: number | undefined,
  now: Dayjs,
  dayBoundaries: { start: { hour: number, minute: number }, end: { hour: number, minute: number }},
}

const isGroupDue = ({ recurrence, lastCompletedMs, now, dayBoundaries }: Params): boolean => {
  if (!recurrence) return false

  const mostRecentOccurrence = getOccurrence.previous(recurrence, now, dayBoundaries)
  if (!mostRecentOccurrence) return false

  // Completing anywhere inside a turn serves it, so dueness hangs on when that turn opened,
  // not on when it came due.
  const mostRecentDueTurn = getOccurrence.currentSlot(recurrence, mostRecentOccurrence, dayBoundaries)

  return isBehind(lastCompletedMs, (mostRecentDueTurn?.opensAt ?? mostRecentOccurrence).valueOf())
}

export default isGroupDue
