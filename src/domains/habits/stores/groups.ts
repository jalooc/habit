import { observable } from '@legendapp/state'
import { synced } from '@legendapp/state/sync'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { z } from 'zod'
import { devLog } from 'src/domains/devTools/utils/devLog'
import { serializeError } from 'serialize-error'
import { parseRRule } from 'src/domains/recurrence/utils/recurrence'

const groupIdSchema = z.uuid()

const recurrenceSchema = z.object({
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
}).strict()

const groupObjectSchema = z.object({
  name: z.string(),
  habits: z.record(z.string(), z.literal(true)),
  recurrence: recurrenceSchema.optional(),
  lastServedAt: z.number().nullable(),
}).strict()

// What may actually be sitting on disk, which is not the same thing. Legend State never writes a
// load transform's output back and afterwards persists one path at a time, so a group's *fields*
// migrate independently: a rotation whose recurrence was never rewritten still holds a v1 RRULE
// string, while a tick since the upgrade has already given the same group a v3 `lastServedAt`. No
// single schema version describes that group. So versions are not discriminated at all — every
// field is read in whichever shape it is in and normalised on the way through.
const persistedGroupSchema = z.object({
  name: z.string(),
  habits: z.record(z.string(), z.literal(true)),
  recurrence: z.union([recurrenceSchema, z.string()]).optional(),
  lastServedAt: z.number().nullable().optional(),
}).strict()

// Only the keys are validated at this level, so that one unreadable group is the only thing a
// table-wide schema would take down with it.
const tableSchema = z.record(groupIdSchema, z.unknown())

const groupSchema = z.record(groupIdSchema, groupObjectSchema) // eslint-disable-line @typescript-eslint/no-unused-vars

type StoreType = z.infer<typeof groupSchema>

export const parsePersistedGroups = (value: unknown): StoreType =>
  Object.fromEntries(
    Object.entries(tableSchema.parse(value)).map(([id, group]) => [id, parseGroup(id, group)]),
  )

const parseGroup = (groupId: string, value: unknown): z.infer<typeof groupObjectSchema> => {
  const parsed = persistedGroupSchema.safeParse(value)

  if (!parsed.success) {
    devLog('Failed to load a group from storage', {
      groupId,
      group: value,
      error: serializeError(parsed.error),
    })

    throw parsed.error
  }

  const { recurrence, lastServedAt, ...group } = parsed.data

  return {
    ...group,
    recurrence: typeof recurrence === 'string' ? parseRRule(recurrence) : recurrence,
    lastServedAt: lastServedAt ?? NEVER_SERVED,
  }
}

// A rotation that predates the service record comes back as never served, so it falls due once and
// settles the moment it is. It is tempting to seed it instead from the most recent completion among
// its habits, which is what dueness used to read, and that is what the first attempt did. It can't
// work: Legend State merges a load transform's output into the observable but never writes it back,
// and afterwards diffs only observable against observable — so the migrated shape never reaches
// storage, and a habits-derived seed would be recomputed on every launch. That is precisely the
// cross-rotation credit this store exists to get rid of. Never-served is the one answer that is
// stable under being recomputed.
const NEVER_SERVED = null

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
