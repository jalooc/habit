import { atom, getDefaultStore } from 'jotai'
import groupsAtom, { withGroupUpdated, withHabitLinked, withHabitUnlinked } from 'src/domains/habits/stores/groups'
import habitsAtom, { withHabitUpdated } from 'src/domains/habits/stores/habits'
import lastActionAtom from 'src/domains/habits/stores/lastAction'

const store = getDefaultStore()

const actionHabitAtom = atom(null, (get, set, habitId: string, type: 'completed' | 'skipped', groupId: string) => {
  const habit = get(habitsAtom)[habitId]
  const rotations = get(groupsAtom)
  const now = Date.now()

  set(lastActionAtom, {
    habitId,
    habitName: habit.name,
    groupId,
    type,
    prevLastActioned: habit.lastActioned,
    prevLastServedAt: Object.hasOwn(rotations, groupId) ? rotations[groupId].lastServedAt : null,
    at: now,
  })

  set(habitsAtom, habits => withHabitUpdated(habits, habitId, current => ({
    ...current,
    lastActioned: { timestamp: now, type },
  })))

  if (type === 'completed') {
    set(groupsAtom, groups => withGroupUpdated(groups, groupId, group => ({ ...group, lastServedAt: now })))
  }
})

const linkHabitAtom = atom(null, (get, set, habitId: string, groupId: string) => {
  set(lastActionAtom, {
    type: 'linked',
    habitId,
    habitName: get(habitsAtom)[habitId].name,
    groupId,
    at: Date.now(),
  })

  set(groupsAtom, groups => withHabitLinked(groups, groupId, habitId))
})

const deleteHabitAtom = atom(null, (get, set, habitId: string) => {
  const habit = get(habitsAtom)[habitId]
  const rotations = get(groupsAtom)
  const groupIds = Object.keys(rotations).filter(groupId => habitId in rotations[groupId].habits)

  set(lastActionAtom, { type: 'deleted', habitId, habitName: habit.name, habit, groupIds, at: Date.now() })
  set(groupsAtom, groups => groupIds.reduce((rest, groupId) => withHabitUnlinked(rest, groupId, habitId), groups))
  set(habitsAtom, ({ [habitId]: _deleted, ...habits }) => habits)
})

const undoLastActionAtom = atom(null, (get, set) => {
  const action = get(lastActionAtom)
  if (!action) {
    console.error('undoLastAction called with no action to undo')
    return
  }

  if (action.type === 'linked') {
    set(groupsAtom, groups => withHabitUnlinked(groups, action.groupId, action.habitId))
  } else if (action.type === 'deleted') {
    set(habitsAtom, habits => ({ ...habits, [action.habitId]: action.habit }))
    set(groupsAtom, groups => action.groupIds.reduce(
      (restored, groupId) => withHabitLinked(restored, groupId, action.habitId),
      groups,
    ))
  } else {
    set(habitsAtom, habits => withHabitUpdated(habits, action.habitId, ({ lastActioned: _undone, ...habit }) =>
      action.prevLastActioned === undefined ? habit : { ...habit, lastActioned: action.prevLastActioned }))
    set(groupsAtom, groups => withGroupUpdated(groups, action.groupId, group => ({
      ...group,
      lastServedAt: action.prevLastServedAt,
    })))
  }

  set(lastActionAtom, undefined)
})

export const actionHabit = (habitId: string, type: 'completed' | 'skipped', groupId: string) =>
  void store.set(actionHabitAtom, habitId, type, groupId)

export const linkHabit = (habitId: string, groupId: string) => void store.set(linkHabitAtom, habitId, groupId)

export const deleteHabit = (habitId: string) => void store.set(deleteHabitAtom, habitId)

export const undoLastAction = () => void store.set(undoLastActionAtom)

export const dismissLastAction = () => void store.set(lastActionAtom, undefined)
