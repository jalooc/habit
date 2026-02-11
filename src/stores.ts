import { observable } from '@legendapp/state'

type Id = string
type HabitId = Id
type GroupId = Id

export const habits$ = observable<
  Record<HabitId, {
    name: string,
  }>
>({})

export const groups$ = observable<
  Record<GroupId, {
    name: string,
    habits: Record<HabitId, true>
  }>
>({})