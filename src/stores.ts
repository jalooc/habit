import { observable } from '@legendapp/state'
import { synced } from "@legendapp/state/sync"
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'

type Id = string
type HabitId = Id
type GroupId = Id

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

export const groups$ = observable<
  Record<GroupId, {
    name: string,
    habits: Record<HabitId, true>
  }>
>(synced({
  initial: {},
  persist: {
    name: "groups",
    plugin: ObservablePersistMMKV
  }
}))