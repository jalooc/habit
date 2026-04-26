import { observable } from '@legendapp/state'
import { synced } from '@legendapp/state/sync'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { z } from 'zod'

export const habitIdSchema = z.uuid()

export const habitsSchema = z.record(habitIdSchema, z.object({
  name: z.string(),
  lastCompleted: z.iso.datetime().optional(),
}))

const habits$ = observable<
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

export default habits$

export type Habits = ReturnType<typeof habits$.get>
