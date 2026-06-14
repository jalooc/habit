import { observable } from '@legendapp/state'
import type { HabitsStores } from 'src/domains/habits/stores/habits'

type LastAction = {
  habitId: string,
  habitName: string,
  type: 'completed' | 'skipped',
  prevLastActioned: HabitsStores[string]['lastActioned'],
  at: number,
}

const lastAction$ = observable<LastAction | undefined>(undefined)

export default lastAction$
