import type { HabitsStore } from 'src/domains/habits/stores/habits'

const orderQueue = (
  habitIds: string[],
  habits: HabitsStore,
): string[] =>
  [...habitIds].sort(
    (a, b) =>
      (habits[a].lastActioned?.timestamp ?? 0) -
      (habits[b].lastActioned?.timestamp ?? 0),
  )

export default orderQueue
