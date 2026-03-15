import { observable } from '@legendapp/state'
import { synced } from '@legendapp/state/sync'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { z } from 'zod'

export const habitIdSchema = z.uuid()

const habitsSchema = z.record(habitIdSchema, z.object({
  name: z.string(),
  lastCompleted: z.iso.datetime().optional(),
}))

export default observable<
  z.infer<typeof habitsSchema>
>(synced({
  initial: {},
  persist: {
    name: 'habits',
    plugin: ObservablePersistMMKV,
    transform: {
      load: (value: unknown) => habitsSchema.parse(value),
    },
  },
}))
