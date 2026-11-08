import type { HabitsStore } from 'src/domains/habits/stores/habits'

// A rotation can name a habit that didn't load (left out as unreadable, or not restored yet). The
// rotation keeps the id, so the habit comes back if it's restored, but it has no place in the queue.
const orderQueue = (
  habitIds: string[],
  habits: HabitsStore,
): string[] =>
  habitIds
    .filter(habitId => Object.hasOwn(habits, habitId))
    .sort(
      (a, b) =>
        (habits[a].lastActioned?.timestamp ?? 0) -
        (habits[b].lastActioned?.timestamp ?? 0),
    )

export default orderQueue
