import { batch } from '@legendapp/state'
import groups$ from 'src/domains/habits/stores/groups'
import habits$ from 'src/domains/habits/stores/habits'
import lastAction$ from 'src/domains/habits/stores/lastAction'

// Writing by path into a rotation that is already gone would persist a partial group object, which
// fails the schema on the next load and takes every rotation down with it.
const rotationExists = (groupId: string) => groupId in groups$.peek()

export const actionHabit = (habitId: string, type: 'completed' | 'skipped', groupId: string) => {
  const habit = habits$[habitId].peek()
  const now = Date.now()
  const doesRotationExist = rotationExists(groupId)

  batch(() => {
    lastAction$.set({
      habitId,
      habitName: habit.name,
      groupId,
      type,
      prevLastActioned: habit.lastActioned,
      prevLastServedAt: doesRotationExist ? groups$[groupId].lastServedAt.peek() : null,
      at: now,
    })

    habits$[habitId].lastActioned.set({ timestamp: now, type })

    if (type === 'completed' && doesRotationExist) groups$[groupId].lastServedAt.set(now)
  })
}

export const linkHabit = (habitId: string, groupId: string) => {
  const habit = habits$[habitId].peek()
  const now = Date.now()

  batch(() => {
    lastAction$.set({
      type: 'linked',
      habitId,
      habitName: habit.name,
      groupId,
      at: now,
    })

    if (rotationExists(groupId)) groups$[groupId].habits[habitId].set(true)
  })
}

export const undoLastAction = () => {
  const action = lastAction$.peek()
  if (!action) {
    console.error('undoLastAction called with no action to undo')
    return
  }

  batch(() => {
    if (action.type === 'linked') {
      if (rotationExists(action.groupId)) {
        groups$[action.groupId].habits[action.habitId].delete()
      }
    } else {
      if (action.prevLastActioned === undefined) {
        habits$[action.habitId].lastActioned.delete()
      } else {
        habits$[action.habitId].lastActioned.set(action.prevLastActioned)
      }

      if (rotationExists(action.groupId)) {
        groups$[action.groupId].lastServedAt.set(action.prevLastServedAt)
      }
    }

    lastAction$.set(undefined)
  })
}

export const dismissLastAction = () => {
  lastAction$.set(undefined)
}
