// Minimal structural shape of an rrule-temporal recurrence — what the dueness
// logic actually needs. Both a real RRuleTemporal and the structurally typed
// recurrence that Legend State's groups$.get() yields satisfy this, so callers
// can pass either without nominal-type friction.
import { Recurrence } from 'src/domains/habits/screens/EditSchedule/recurrence'
import getOccurrence from 'src/domains/habits/utils/habitsNotificationsScheduler/buildNotifications/getOccurrence'
import { Dayjs } from 'dayjs'

export type RecurrenceLike = {
  previous: (date: Date, inclusive?: boolean) => { epochMilliseconds: number } | null,
  next: (date: Date, inclusive?: boolean) => { epochMilliseconds: number } | null,
}

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
