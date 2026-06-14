import { RRuleTemporal } from 'rrule-temporal'

type Params = {
  recurrence: RRuleTemporal | undefined,
  upNextLastActioned: number | undefined,
  now: Date,
}

const isGroupDue = ({ recurrence, upNextLastActioned, now }: Params): boolean => {
  if (!recurrence) return false

  const mostRecentOccurrence = recurrence.previous(now, true)
  if (!mostRecentOccurrence) return false

  const occurrenceMs = mostRecentOccurrence.epochMilliseconds

  return upNextLastActioned === undefined || upNextLastActioned < occurrenceMs
}

export default isGroupDue
