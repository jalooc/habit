import { observable } from '@legendapp/state'
import { synced } from '@legendapp/state/sync'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { z } from 'zod'
import { objectEntries } from 'tsafe'
import { fromEntries } from 'remeda'
import { devLog } from 'src/domains/devTools/utils/devLog'
import { serializeError } from 'serialize-error'

export const habitIdSchema = z.uuid()

const habitsSchemaV1 = z.record(habitIdSchema, z.object({
  name: z.string(),
  lastCompleted: z.iso.datetime().optional(),
}))

const habitsSchemaV2 = z.record(habitIdSchema, z.object({
  name: z.string(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  lastActioned: z.object({
    timestamp: z.number(),
    type: z.enum(['completed', 'skipped']),
  }).optional(),
}))

const habitsSchema = habitsSchemaV2 // eslint-disable-line @typescript-eslint/no-unused-vars

type StoreType = z.infer<typeof habitsSchema>

export const parsePersistedHabits = (value: unknown): StoreType => {
  try {
    return habitsSchemaV2.parse(value)
  } catch (v2VersionError) {
    try {
      const vm1 = habitsSchemaV1.parse(value)

      return fromEntries(objectEntries(vm1).map(([id, habit]) => [id, {
        ...habit,
        ...(habit.lastCompleted && {
          lastActioned: {
            timestamp: new Date(habit.lastCompleted).getTime(),
            type: 'completed' as const,
          },
        }),
      }]))
    } catch (v1VersionError) {
      devLog('Failed to load habits from storage', {
        v1VersionError: serializeError(v1VersionError),
        v2VersionError: serializeError(v2VersionError),
      })

      throw v1VersionError
    }
  }
}

const habits$ = observable<StoreType>(synced({
  initial: {},
  persist: {
    name: 'habits',
    plugin: ObservablePersistMMKV,
    transform: {
      load: parsePersistedHabits,
    },
  },
}))

export default habits$

export type HabitsStores = ReturnType<typeof habits$.get>
