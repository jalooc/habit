import { z } from 'zod'
import { parseRRule } from 'src/domains/recurrence/utils/recurrence'
import atomWithMMKV from 'src/domains/misc/utils/atomWithMMKV'

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

// What a stored or backed-up group may look like, which is not the same thing: older payloads hold
// a v1 RRULE string for `recurrence` and no `lastServedAt` at all, and a backup may mix groups of
// different ages. So versions are not discriminated — every field is read in whichever shape it is
// in and normalised on the way through. The whole table is written back on the first change, which
// is what settles the normalised shape on disk.
const persistedGroupSchema = z.object({
  name: z.string(),
  habits: z.record(z.string(), z.literal(true)),
  recurrence: z.union([recurrenceSchema, z.string()]).optional(),
  lastServedAt: z.number().nullable().optional(),
}).strict()

const tableSchema = z.record(z.string(), z.unknown())

const groupSchema = z.record(groupIdSchema, groupObjectSchema) // eslint-disable-line @typescript-eslint/no-unused-vars

type StoreType = z.infer<typeof groupSchema>

// A group that can't be read is left out and reported rather than failing the table: the table is
// written back whole on the next change, so failing it would take every rotation with it.
export const parsePersistedGroups = (
  value: unknown,
  onUnreadable: (groupId: string, error: unknown) => unknown,
): StoreType =>
  Object.fromEntries(Object.entries(tableSchema.parse(value)).flatMap(([groupId, group]) => {
    try {
      return [[groupIdSchema.parse(groupId), parseGroup(group)] as const]
    } catch (error) {
      onUnreadable(groupId, error)
      return []
    }
  }))

const parseGroup = (value: unknown): z.infer<typeof groupObjectSchema> => {
  const { recurrence, lastServedAt, ...group } = persistedGroupSchema.parse(value)

  return {
    ...group,
    recurrence: typeof recurrence === 'string' ? parseRRule(recurrence) : recurrence,
    lastServedAt: lastServedAt ?? NEVER_SERVED,
  }
}

// A rotation that predates the service record comes back as never served, so it falls due once and
// settles the moment it is. Seeding it from the most recent completion among its habits instead
// would hand it credit for a tick made in another rotation — precisely the cross-rotation credit
// this record exists to get rid of.
const NEVER_SERVED = null

const groupsAtom = atomWithMMKV({
  key: 'groups',
  initialValue: {},
  parse: parsePersistedGroups,
})

export default groupsAtom

export type GroupsStore = StoreType

// A rotation that is no longer there is left alone: writing into it would store a partial group,
// which the next launch can't read.
export const withGroupUpdated = (
  groups: GroupsStore,
  groupId: string,
  update: (group: GroupsStore[string]) => GroupsStore[string],
) => Object.hasOwn(groups, groupId) ? { ...groups, [groupId]: update(groups[groupId]) } : groups

export const withHabitLinked = (groups: GroupsStore, groupId: string, habitId: string) =>
  withGroupUpdated(groups, groupId, group => ({ ...group, habits: { ...group.habits, [habitId]: true }}))

export const withHabitUnlinked = (groups: GroupsStore, groupId: string, habitId: string) =>
  withGroupUpdated(groups, groupId, group => {
    const { [habitId]: _unlinked, ...habits } = group.habits

    return { ...group, habits }
  })
