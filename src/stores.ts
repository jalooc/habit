import { observable } from '@legendapp/state'
import { synced } from "@legendapp/state/sync"
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { RRuleTemporal } from 'rrule-temporal'
import { z } from 'zod'

type Id = string
type HabitId = Id
type GroupId = Id

type Group = {
  name: string
  habits: Record<HabitId, true>
  recurrence?: RRuleTemporal
}

export const habits$ = observable<
  Record<HabitId, {
    name: string,
  }>
>(synced({
  initial: {},
  persist: {
    name: "habits",
    plugin: ObservablePersistMMKV
  }
}))

export const dayBoundaries$ = observable<{
  start: { hour: number; minute: number }
  end: { hour: number; minute: number }
}>(synced({
  initial: { start: { hour: 7, minute: 0 }, end: { hour: 23, minute: 0 } },
  persist: {
    name: "day-boundaries",
    plugin: ObservablePersistMMKV
  }
}))

const persistedGroupsSchema = z.record(z.string(), z.object({
  name: z.string(),
  habits: z.record(z.string(), z.literal(true)),
  recurrence: z.string().optional(),
}))

const groupsSchema = z.record(z.string(), z.object({
  name: z.string(),
  habits: z.record(z.string(), z.literal(true)),
  recurrence: z.instanceof(RRuleTemporal).optional(),
}).partial())

export const groups$ = observable<
  Record<GroupId, Group>
>(synced({
  initial: {},
  persist: {
    name: "groups",
    plugin: ObservablePersistMMKV,
    transform: {
      load: (value: unknown) => {
        return Object.fromEntries(
          Object.entries(persistedGroupsSchema.parse(value)).map(([id, group]) => [id, {
            ...group,
            recurrence: group.recurrence
              ? new RRuleTemporal({ rruleString: group.recurrence })
              : undefined,
          }])
        )
      },
      save: (value: unknown) => {
        try {
          return Object.fromEntries(
            Object.entries(groupsSchema.parse(value)).map(([id, group]) => [id, {
              ...group,
              recurrence: group.recurrence?.toString(),
            }]),
          )
        } catch (error) {
          console.error("Error while saving groups", { error })
        }
      },
    },
  },
}))
