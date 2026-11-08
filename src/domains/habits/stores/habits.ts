import { z } from 'zod'
import atomWithMMKV, { getUnreadableCopiesOf } from 'src/domains/misc/utils/atomWithMMKV'

export const habitIdSchema = z.uuid()

const habitsSchemaV1 = z.record(habitIdSchema, z.object({
  name: z.string(),
  lastCompleted: z.iso.datetime().optional(),
}).strict())

const habitsSchemaV2 = z.record(habitIdSchema, z.object({
  name: z.string(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  lastActioned: z.object({
    timestamp: z.number(),
    type: z.enum(['completed', 'skipped']),
  }).strict().optional(),
}).strict())

const habitsSchema = habitsSchemaV2 // eslint-disable-line @typescript-eslint/no-unused-vars

type StoreType = z.infer<typeof habitsSchema>

// The store that preceded this one wrote one field at a time and never removed one, so a v1 habit
// changed since holds its `lastCompleted` next to v2 fields. A habit is therefore read as v2 plus
// what v1 may have left behind, not as one version or the other.
const persistedHabitSchema = habitsSchemaV2.valueType.extend({
  lastCompleted: habitsSchemaV1.valueType.shape.lastCompleted,
})

const tableSchema = z.record(z.string(), z.unknown())

// A habit that can't be read is left out and reported rather than failing the table: the table is
// written back whole on the next change, so failing it would take every habit with it.
export const parsePersistedHabits = (
  value: unknown,
  onUnreadable: (habitId: string, error: unknown) => unknown,
): StoreType =>
  Object.fromEntries(Object.entries(tableSchema.parse(value)).flatMap(([habitId, habit]) => {
    try {
      return [[habitIdSchema.parse(habitId), parseHabit(habit)] as const]
    } catch (error) {
      onUnreadable(habitId, error)
      return []
    }
  }))

const parseHabit = (value: unknown): StoreType[string] => {
  const { lastCompleted, ...habit } = persistedHabitSchema.parse(value)
  // v2 never writes `lastCompleted`, so a `lastActioned` next to one is the newer record
  if (habit.lastActioned || !lastCompleted) return habit

  return { ...habit, lastActioned: { timestamp: new Date(lastCompleted).getTime(), type: 'completed' }}
}

const STORAGE_KEY = 'habits'

const habitsAtom = atomWithMMKV({
  key: STORAGE_KEY,
  initialValue: {},
  parse: parsePersistedHabits,
})

export default habitsAtom

export type HabitsStore = StoreType

export const getUnreadableHabitsCopies = () => getUnreadableCopiesOf(STORAGE_KEY)

// A habit that is no longer there is left alone: writing into it would store a nameless partial,
// which can't be read on the next launch.
export const withHabitUpdated = (
  habits: HabitsStore,
  habitId: string,
  update: (habit: HabitsStore[string]) => HabitsStore[string],
) => Object.hasOwn(habits, habitId) ? { ...habits, [habitId]: update(habits[habitId]) } : habits
