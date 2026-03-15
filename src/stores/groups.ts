import { observable } from '@legendapp/state'
import { synced } from '@legendapp/state/sync'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { RRuleTemporal } from 'rrule-temporal'
import { z } from 'zod'
import { habitIdSchema } from './habits'
import { PartialDeep } from 'type-fest'

const groupIdSchema = z.uuid()

const groupSchema = z.object({
  name: z.string(),
  habits: z.record(z.string(), z.literal(true)),
  recurrence: z.instanceof(RRuleTemporal).optional(),
})

const groupsSchema = z.record(groupIdSchema, groupSchema)

const persistedGroupsSchema = z.record(groupIdSchema, groupSchema
  .omit({ recurrence: true })
  .extend({
    recurrence: z.string().optional(),
  }))

export default observable<
  z.infer<typeof groupsSchema>
>(synced({
  initial: {},
  persist: {
    name: 'groups',
    plugin: ObservablePersistMMKV,
    transform: {
      load: (value: unknown) => {
        return Object.fromEntries(
          Object.entries(persistedGroupsSchema.parse(value)).map(([id, group]) => [id, {
            ...group,
            recurrence: group.recurrence
              ? new RRuleTemporal({ rruleString: group.recurrence })
              : undefined,
          }]),
        )
      },
      save: (value: PartialDeep<z.infer<typeof groupsSchema>>) => {
        try {
          return Object.fromEntries(
            Object.entries(value).map(([id, group]) => [id, {
              ...group,
              ...(group?.recurrence && { recurrence: group.recurrence?.toString?.() }),
            }]),
          )
        } catch (error) {
          console.error('Error while saving groups', { error })
        }
      },
    },
  },
}))
