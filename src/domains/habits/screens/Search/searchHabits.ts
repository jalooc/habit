import Fuse, { type IFuseOptions } from 'fuse.js'
import { sortBy } from 'remeda'
import type { HabitsStore } from 'src/domains/habits/stores/habits'
import foldText from 'src/domains/habits/utils/foldText'

type IndexedHabit = {
  habitId: string,
  name: string,
}

const fuseOptions = {
  keys: [{ name: 'name', getFn: habit => foldText(habit.name) }],
  ignoreLocation: true,
  // without it Fuse favours shorter names, so scores would almost never tie and the up-next tie-break would never apply
  ignoreFieldNorm: true,
  threshold: 0.3,
  isCaseSensitive: false,
  ignoreDiacritics: true,
  includeScore: true,
} satisfies IFuseOptions<IndexedHabit>

// Names only: habits are one table keyed by id, so a habit in several rotations is indexed once.
export const createHabitIndex = (habits: HabitsStore) => new Fuse(
  Object.entries(habits).map(([habitId, { name }]) => ({ habitId, name })),
  fuseOptions,
)

type HabitIndex = ReturnType<typeof createHabitIndex>

const searchHabits = (query: string, index: HabitIndex, isUpNext: (habitId: string) => boolean) => {
  const foldedQuery = foldText(query.trim())
  if (!foldedQuery) return []

  return sortBy(
    index.search(foldedQuery),
    result => result.score ?? 0,
    result => isUpNext(result.item.habitId) ? 0 : 1,
  ).map(result => result.item.habitId)
}

export default searchHabits
