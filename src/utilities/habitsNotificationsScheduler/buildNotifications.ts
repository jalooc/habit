import type { Groups } from '../../stores/groups'
import type { Habits } from '../../stores/habits'
import { devLog } from '../../domains/devTools/utils/devLog'

const MAX_NOTIFICATIONS = 64 // iOS allows max 64 scheduled notifications per app

type ScheduledNotification = {
  title: string,
  body: string,
  date: Date,
  data: { url: string },
}

export default (
  groups: Groups,
  habits: Habits,
): ScheduledNotification[] => {
  const all = Object.entries(groups).flatMap(([groupId, group]) => {
    if (!group.recurrence) return []

    const names = findSortedHabitsName(group.habits, habits)

    const occurrences = group.recurrence.all((_, i) => i < names.length)

    return occurrences.map((occurence, i) => ({
      title: group.name,
      body: names[i % names.length],
      date: new Date(occurence.epochMilliseconds),
      data: { url: `group/${groupId}` },
    }))
  })

  const result = [...all]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_NOTIFICATIONS)

  devLog('rescheduling notifications', { notifications: result })

  return result
}

const findSortedHabitsName = (
  groupHabits: NonNullable<Groups[string]>['habits'],
  habitsMap: Habits,
): string[] => {
  const habits = Object.keys(groupHabits)
    .map(id => habitsMap[id])

  return [...habits]
    .sort((a, b) => getLastCompletedTime(a) - getLastCompletedTime(b))
    .map(h => h.name)
}

const getLastCompletedTime = (habit: NonNullable<Habits[string]>) =>
  habit.lastCompleted ? Date.parse(habit.lastCompleted) : 0
