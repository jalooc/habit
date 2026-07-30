import { observable } from '@legendapp/state'
import { synced } from '@legendapp/state/sync'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { RRuleTemporal } from 'rrule-temporal'
import { z } from 'zod'
import { devLog } from 'src/domains/devTools/utils/devLog'
import { serializeError } from 'serialize-error'
import { parseRRule } from 'src/domains/recurrence/utils/recurrence'

const groupIdSchema = z.uuid()

const persistedGroupsSchemaV1 = z.record(
  groupIdSchema,
  z.object({
    name: z.string(),
    habits: z.record(z.string(), z.literal(true)),
    recurrence: z.instanceof(RRuleTemporal).optional(),
  })
    .omit({ recurrence: true })
    .extend({
      recurrence: z.string().optional(),
    })
)

const groupSchemaV2 = z.record(groupIdSchema, z.object({
  name: z.string(),
  habits: z.record(z.string(), z.literal(true)),
  recurrence: z.object({
    type: z.enum([
      'times-per-day',
      'every-x-hours',
      'every-x-days',
      'times-per-week',
      'times-per-month',
    ]),
    value: z.number(),
    specificDays: z.record(
      z.enum(['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su']),
      z.boolean(),
    ).optional(),
  }).optional(),
}))

const groupSchema = groupSchemaV2 // eslint-disable-line @typescript-eslint/no-unused-vars

type StoreType = z.infer<typeof groupSchema>

export const parsePersistedGroups = (value: unknown): StoreType => {
  try {
    return groupSchemaV2.parse(value)
  } catch (v2VersionError) {
    try {
      const vm1 = persistedGroupsSchemaV1.parse(value)

      return Object.fromEntries(
        Object.entries(vm1).map(([id, group]) => {
          const recurrence = group.recurrence ?
            parseRRule(group.recurrence) :
            undefined

          return [id, {
            ...group,
            recurrence,
          }]
        }),
      )
    } catch (v1VersionError) {
      devLog('Failed to load groups from storage', {
        v1VersionError: serializeError(v1VersionError),
        v2VersionError: serializeError(v2VersionError),
      })

      throw v1VersionError
    }
  }
}

const groups$ = observable<
  StoreType
>(synced({
  initial: {},
  persist: {
    name: 'groups',
    plugin: ObservablePersistMMKV,
    transform: {
      load: parsePersistedGroups,
    },
  },
}))

export default groups$

export type GroupsStore = ReturnType<typeof groups$.get>
