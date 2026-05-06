import { GroupsStore } from 'src/domains/habits/stores/groups'
import { HabitsStores } from 'src/domains/habits/stores/habits'
import { devLog } from 'src/domains/devTools/utils/devLog'
import { createGroupScreenLink } from 'src/domains/habits/utils/linking'
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

  const result = [...all]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_NOTIFICATIONS)

  devLog('rescheduling notifications', { notifications: result })

  return result
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

const getOccurrencesAfter = (
  recurrence: NonNullable<GroupsStore[string]['recurrence']>,
  after: Date,
  count: number
) => {
  const occurrences: Temporal.ZonedDateTime[] = []
  for (let i = 0; i < count; i++) {
    const occurrence = recurrence.next(occurrences.at(-1) ?? after, false)
    if (occurrence) occurrences.push(occurrence)
    else break
  }
  return occurrences
}
