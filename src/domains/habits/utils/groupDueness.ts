// Minimal structural shape of an rrule-temporal recurrence — what the dueness
// logic actually needs. Both a real RRuleTemporal and the structurally typed
// recurrence that Legend State's groups$.get() yields satisfy this, so callers
// can pass either without nominal-type friction.
export type RecurrenceLike = {
  previous: (date: Date, inclusive?: boolean) => { epochMilliseconds: number } | null,
  next: (date: Date, inclusive?: boolean) => { epochMilliseconds: number } | null,
}

// The single source of the "behind" rule: a rotation is behind
// when its last completed tick predates the occurrence (or it never completed).
const isBehind = (lastCompletedMs: number | undefined, occurrenceMs: number): boolean =>
  lastCompletedMs === undefined || lastCompletedMs < occurrenceMs

type Params = {
  recurrence: RecurrenceLike | undefined,
  lastCompletedMs: number | undefined,
  now: Date,
}

const isGroupDue = ({ recurrence, lastCompletedMs, now }: Params): boolean => {
  if (!recurrence) return false

  const mostRecentOccurrence = recurrence.previous(now, true)
  if (!mostRecentOccurrence) return false

  return isBehind(lastCompletedMs, mostRecentOccurrence.epochMilliseconds)
}

export default isGroupDue
