import { observable } from '@legendapp/state'
import { synced } from '@legendapp/state/sync'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { z } from 'zod'

export const dayBoundariesSchema = z.object({
  start: z.object({
    hour: z.number(),
    minute: z.number(),
  }),
  end: z.object({
    hour: z.number(),
    minute: z.number(),
  }),
})

export default observable<z.infer<typeof dayBoundariesSchema>>(synced({
  initial: { start: { hour: 7, minute: 0 }, end: { hour: 23, minute: 0 } },
  persist: {
    name: 'day-boundaries',
    plugin: ObservablePersistMMKV,
    transform: {
      load: (value: unknown) => dayBoundariesSchema.parse(value),
    },
  },
}))
