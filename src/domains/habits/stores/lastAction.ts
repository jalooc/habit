import { observable } from '@legendapp/state'
import type { HabitsStores } from 'src/domains/habits/stores/habits'
import type { GroupsStore } from 'src/domains/habits/stores/groups'

type TickAction = {
  type: 'completed' | 'skipped',
  habitId: string,
  habitName: string,
  groupId: string,
  prevLastActioned: HabitsStores[string]['lastActioned'],
  prevLastServedAt: GroupsStore[string]['lastServedAt'],
  at: number,
}

type LinkedAction = {
  type: 'linked',
  habitId: string,
  habitName: string,
  groupId: string,
  at: number,
}

export type LastAction = TickAction | LinkedAction

const lastAction$ = observable<LastAction | undefined>(undefined)

export default lastAction$
