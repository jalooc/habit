import { firstBy, isEmptyish, keys, map, pipe, sort, take } from 'remeda'
import dayjs, { Dayjs } from 'dayjs'

import { GroupsStore } from 'src/domains/habits/stores/groups'
import { HabitsStores } from 'src/domains/habits/stores/habits'
import { createGroupScreenLink } from 'src/domains/habits/utils/linking'
import lastCompletedInGroup from 'src/domains/habits/utils/lastCompletedInGroup'
import nextTurnDueAt from 'src/domains/habits/utils/nextTurnDueAt'

import getOccurrence from 'src/domains/recurrence/utils/getOccurrence'

const MAX_NOTIFICATIONS = 64 // iOS allows max 64 scheduled notifications per app

type ScheduledNotification = {
  title: string,
  body: string | undefined,
  date: Date,
  data: { url: string },
}

export default (
  groups: GroupsStore,
  allHabitsMap: HabitsStores,
  dayBoundaries: Parameters<typeof getOccurrence['next']>[2],
): ScheduledNotification[] => {
  const all = Object.entries(groups).flatMap(([groupId, group]) => {
    if (!group.recurrence || isEmptyish(group.habits)) return []

    const nextNameHabitName = pipe(
      group.habits,
      keys(),
      map(habitId => allHabitsMap[habitId]),
      firstBy([habit => habit.lastActioned?.timestamp ?? 0, 'asc'])
    )?.name

    /*
      TODO: optimize by calculating occurrences taking into account how far they reach compared to each other, instead of calculating a batch of occurrences for each group and then ignoring the excess
     */
    // Starting from the next *unserved* turn keeps an early tick from being nudged about:
    // the scheduler rebuilds on every action, so a turn served ahead of time drops out here.
    const firstOccurrence = nextTurnDueAt({
      recurrence: group.recurrence,
      lastCompletedMs: lastCompletedInGroup(keys(group.habits), allHabitsMap),
      now: dayjs(),
      dayBoundaries,
    })

    const occurrences: Dayjs[] = []
    let nextOccurrence = firstOccurrence
    while (nextOccurrence) {
      occurrences.push(nextOccurrence)
      if (occurrences.length >= MAX_NOTIFICATIONS) break

      nextOccurrence = getOccurrence.next(group.recurrence, nextOccurrence.add(1, 'minute'), dayBoundaries)
    }

    return occurrences.map(occurrence => ({
      title: group.name,
      body: nextNameHabitName,
      date: occurrence.toDate(),
      data: { url: createGroupScreenLink(groupId) },
    }))
  })

  return pipe(
    all,
    sort((a, b) => a.date.getTime() - b.date.getTime()),
    take(MAX_NOTIFICATIONS)
  )
}
