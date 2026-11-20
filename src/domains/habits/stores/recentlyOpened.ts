import { z } from 'zod'
import atomWithMMKV from 'src/domains/misc/utils/atomWithMMKV'
import { habitIdSchema, type HabitsStore } from 'src/domains/habits/stores/habits'

const MAX_RECENTLY_OPENED = 5

const recentlyOpenedSchema = z.array(habitIdSchema)

// Ids of habits opened from search results, newest first
const recentlyOpenedAtom = atomWithMMKV({
  key: 'recentlyOpenedHabits',
  initialValue: [],
  parse: data => recentlyOpenedSchema.parse(data),
})

export default recentlyOpenedAtom

// A deleted habit is hidden rather than dropped, so undoing the deletion brings it back here too. It
// is dropped the next time a habit is opened, by when the undo is long gone.
export const getRecentlyOpened = (habitIds: string[], habits: HabitsStore) =>
  habitIds.filter(habitId => Object.hasOwn(habits, habitId))

// Keeps the habits a list already shows where they are, so opening one doesn't move its card from under the
// finger. Habits opened since, which the list didn't show, go on top.
export const keepShownOrder = (habitIds: string[], shownIds: string[]) => [
  ...habitIds.filter(id => !shownIds.includes(id)),
  ...shownIds.filter(id => habitIds.includes(id)),
]

export const withHabitOpened = (habitIds: string[], habitId: string, habits: HabitsStore) =>
  [habitId, ...getRecentlyOpened(habitIds, habits).filter(id => id !== habitId)].slice(0, MAX_RECENTLY_OPENED)
