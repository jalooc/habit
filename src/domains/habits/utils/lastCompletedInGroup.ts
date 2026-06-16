import type { HabitsStores } from 'src/domains/habits/stores/habits'

const lastCompletedInGroup = (habitIds: string[], habits: HabitsStores): number | undefined => {
  const completedTimestamps = habitIds.flatMap(id => {
    const lastActioned = habits[id].lastActioned
    return lastActioned?.type === 'completed' ? [lastActioned.timestamp] : []
  })

  if (completedTimestamps.length === 0) return undefined
  return Math.max(...completedTimestamps)
}

export default lastCompletedInGroup
