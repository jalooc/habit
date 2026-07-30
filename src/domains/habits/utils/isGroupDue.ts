import { Recurrence } from 'src/domains/recurrence/utils/recurrence'
import getOccurrence from 'src/domains/recurrence/utils/getOccurrence'
import { Dayjs } from 'dayjs'

// The single source of the "behind" rule: a rotation is behind
// when its last completed tick predates the occurrence (or it never completed).
const isBehind = (lastCompletedMs: number | undefined, occurrenceMs: number): boolean =>
  lastCompletedMs === undefined || lastCompletedMs < occurrenceMs

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

  return isBehind(lastCompletedMs, mostRecentOccurrence.valueOf())
}

export default isGroupDue
