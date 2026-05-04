import { GroupsStore } from 'src/domains/habits/stores/groups'
import { HabitsStores } from 'src/domains/habits/stores/stores'
import { devLog } from 'src/domains/devTools/utils/devLog'
import { createGroupScreenLink } from 'src/domains/habits/utils/linking'

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

    const names = findSortedHabitsName(group.habits, habits)

    const occurrences = group.recurrence.all((_, i) => i < names.length)

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

const findSortedHabitsName = (
  groupHabits: NonNullable<GroupsStore[string]>['habits'],
  habitsMap: HabitsStores,
): string[] => {
  const habits = Object.keys(groupHabits)
    .map(id => habitsMap[id])

  return [...habits]
    .sort((a, b) => getLastCompletedTime(a) - getLastCompletedTime(b))
    .map(h => h.name)
}

const getLastCompletedTime = (habit: NonNullable<HabitsStores[string]>) =>
  habit.lastCompleted ? Date.parse(habit.lastCompleted) : 0
