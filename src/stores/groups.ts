import { observable } from '@legendapp/state'
import { synced } from '@legendapp/state/sync'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { RRuleTemporal } from 'rrule-temporal'
import { z } from 'zod'
import { PartialDeep } from 'type-fest'

const groupIdSchema = z.uuid()

const groupSchema = z.object({
  name: z.string(),
  habits: z.record(z.string(), z.literal(true)),
  recurrence: z.instanceof(RRuleTemporal).optional(),
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const groupsSchema = z.record(groupIdSchema, groupSchema)

export const persistedGroupsSchema = z.record(groupIdSchema, groupSchema
  .omit({ recurrence: true })
  .extend({
    recurrence: z.string().optional(),
  }))

const groups$ = observable<
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
            recurrence: group.recurrence ?
              new RRuleTemporal({ rruleString: group.recurrence }) :
              undefined,
          }]),
        )
      },
      save: (value: PartialDeep<z.infer<typeof groupsSchema>>) => {
        try {
          return Object.fromEntries(
            Object.entries(value).map(([id, group]) => [id, {
              ...group,
              ...(group?.recurrence && { recurrence: group.recurrence.toString?.() }),
            }]),
          )
        } catch (error) {
          console.error('Error while saving groups', { error })
        }
      },
    },
  },
}))

export default groups$

export type Groups = ReturnType<typeof groups$.get>
