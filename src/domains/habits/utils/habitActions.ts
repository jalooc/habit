import habits$ from 'src/domains/habits/stores/habits'
import lastAction$ from 'src/domains/habits/stores/lastAction'

export const actionHabit = (habitId: string, type: 'completed' | 'skipped') => {
  const habit = habits$[habitId].peek()

  lastAction$.set({
    habitId,
    habitName: habit.name,
    type,
    prevLastActioned: habit.lastActioned,
    at: Date.now(),
  })

  habits$[habitId].lastActioned.set({ timestamp: Date.now(), type })
}

export const undoLastAction = () => {
  const action = lastAction$.peek()
  if (!action) {
    console.error('undoLastAction called with no action to undo')
    return
  }

  if (action.prevLastActioned === undefined) {
    habits$[action.habitId].lastActioned.delete()
  } else {
    habits$[action.habitId].lastActioned.set(action.prevLastActioned)
  }

  lastAction$.set(undefined)
}

export const dismissLastAction = () => {
  lastAction$.set(undefined)
}
