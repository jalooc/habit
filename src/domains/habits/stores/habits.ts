import { observable } from '@legendapp/state'
import { synced } from '@legendapp/state/sync'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { z } from 'zod'
import { objectEntries } from 'tsafe'
import { fromEntries } from 'remeda'

export const habitIdSchema = z.uuid()

// habit schema version minus 1
const habitsSchemaVm1 = z.record(habitIdSchema, z.object({
  name: z.string(),
  lastCompleted: z.iso.datetime().optional(),
}))

export const habitsSchema = z.record(habitIdSchema, z.object({
  name: z.string(),
  lastActioned: z.object({
    timestamp: z.number(),
    type: z.enum(['completed', 'skipped']),
  }).optional(),
}))

const habits$ = observable<
  z.infer<typeof habitsSchema>
>(synced({
  initial: {},
  persist: {
    name: 'habits',
    plugin: ObservablePersistMMKV,
    transform: {
      load: (value: unknown) => {
        try {
          return habitsSchema.parse(value)
        } catch {
          const vm1 = habitsSchemaVm1.parse(value)

          return fromEntries(objectEntries(vm1).map(([id, habit]) => [id, {
            ...habit,
            ...(habit.lastCompleted && {
              lastActioned: {
                timestamp: new Date(habit.lastCompleted).getTime(),
                type: 'completed' as const,
              },
            }),
          }])) satisfies z.infer<typeof habitsSchema>
        }
      },
    },
  },
}))

export default habits$

export type HabitsStores = ReturnType<typeof habits$.get>
