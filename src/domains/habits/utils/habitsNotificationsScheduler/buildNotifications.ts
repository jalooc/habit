import { GroupsStore } from 'src/domains/habits/stores/groups'
import { HabitsStores } from 'src/domains/habits/stores/habits'
import { createGroupScreenLink } from 'src/domains/habits/utils/linking'
import { RRuleTemporal } from 'rrule-temporal'
import { Temporal } from '@js-temporal/polyfill'

const MAX_NOTIFICATIONS = 64 // iOS allows max 64 scheduled notifications per app

type ScheduledNotification = {
  title: string,
  body: string,
  date: Date,
  data: { url: string },
}

export default (
  groups: GroupsStore,
  habits: HabitsStores,
): ScheduledNotification[] => {
  const all = Object.entries(groups).flatMap(([groupId, group]) => {
    if (!group.recurrence) return []

    const names = findSortedHabitsNames(group.habits, habits)

    const occurrences = getOccurrencesAfter(group.recurrence, new Date(), names.length)

    return occurrences.map((occurence, i) => ({
      title: group.name,
      body: names[i % names.length],
      date: new Date(occurence.epochMilliseconds),
      data: { url: createGroupScreenLink(groupId, { withTickOff: true }) },
    }))
  })

  return [...all]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_NOTIFICATIONS)
}

const findSortedHabitsNames = (
  groupHabits: NonNullable<GroupsStore[string]>['habits'],
  habitsMap: HabitsStores,
): string[] => {
  const habits = Object.keys(groupHabits)
    .map(id => habitsMap[id])

  return [...habits]
    .sort((a, b) => (a.lastActioned?.timestamp ?? 0) - (b.lastActioned?.timestamp ?? 0))
    .map(h => h.name)
}

type Recurrence = NonNullable<GroupsStore[string]['recurrence']>

// Every rrule-temporal query re-iterates occurrences from DTSTART (through the
// slow Temporal polyfill, with a hard 10k-iteration cap), so the cost of a
// rebuild grows with a group's age. Remember the last occurrence at or before
// "now" per rule instance and resume iteration from there on later rebuilds.
const iterationStarts = new WeakMap<Recurrence, Temporal.ZonedDateTime>()

// Shifting dtstart onto a known occurrence preserves the occurrence sequence,
// except when the rule counts occurrences or pins extra/excluded dates.
const canResumeIteration = (rule: Recurrence) => {
  const { count, rDate, exDate } = rule.options()
  return !count && !rDate?.length && !exDate?.length
}

const getOccurrencesAfter = (
  recurrence: Recurrence,
  after: Date,
  count: number
) => {
  if (count <= 0) return []

  const resumeFrom = iterationStarts.get(recurrence)
  const rule = resumeFrom ?
    new RRuleTemporal({ ...recurrence.options(), dtstart: resumeFrom }) :
    recurrence

  const afterMs = after.getTime()
  const occurrences: Temporal.ZonedDateTime[] = []
  let lastPast: Temporal.ZonedDateTime | undefined

  // The iterator can re-yield an occurrence (e.g. around generator jump
  // optimizations), so only accept strictly increasing ones.
  rule.all(occurrence => {
    if (occurrence.epochMilliseconds <= afterMs) {
      lastPast = occurrence
      return true
    }
    if (occurrences.length >= count) return false
    const prev = occurrences.at(-1)
    if (!prev || occurrence.epochMilliseconds > prev.epochMilliseconds) occurrences.push(occurrence)
    return occurrences.length < count
  })

  if (lastPast && canResumeIteration(recurrence)) iterationStarts.set(recurrence, lastPast)

  return occurrences
}
