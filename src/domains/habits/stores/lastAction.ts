import { observable } from '@legendapp/state'
import type { HabitsStores } from 'src/domains/habits/stores/habits'
import type { GroupsStore } from 'src/domains/habits/stores/groups'

type LastAction = {
  habitId: string,
  habitName: string,
  groupId: string,
  type: 'completed' | 'skipped',
  prevLastActioned: HabitsStores[string]['lastActioned'],
  prevLastServedAt: GroupsStore[string]['lastServedAt'],
  at: number,
}

const lastAction$ = observable<LastAction | undefined>(undefined)

export default lastAction$
