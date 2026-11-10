import { atom } from 'jotai'

import habitsAtom, { type HabitsStore } from 'src/domains/habits/stores/habits'
import type { GroupsStore } from 'src/domains/habits/stores/groups'
import { deleteImageFiles } from 'src/domains/habits/utils/habitImages'

type TickAction = {
  type: 'completed' | 'skipped',
  habitId: string,
  habitName: string,
  groupId: string,
  prevLastActioned: HabitsStore[string]['lastActioned'],
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

type DeletedAction = {
  type: 'deleted',
  habitId: string,
  habitName: string,
  habit: HabitsStore[string],
  groupIds: string[],
  at: number,
}

export type LastAction = TickAction | LinkedAction | DeletedAction

const offeredActionAtom = atom<LastAction | undefined>(undefined)

// A deleted habit's images stay on disk while its undo is on offer. Every way that offer can end
// comes through this write, so this is what finishes the deletion. An undo restores the habit
// before it clears the action, which is what spares the files.
const lastActionAtom = atom(
  get => get(offeredActionAtom),
  (get, set, action: LastAction | undefined) => {
    const offeredActionBeingReplaced = get(offeredActionAtom)
    set(offeredActionAtom, action)

    if (offeredActionBeingReplaced?.type === 'deleted' && !Object.hasOwn(get(habitsAtom), offeredActionBeingReplaced.habitId)) {
      deleteImageFiles(offeredActionBeingReplaced.habit.images ?? [])
    }
  },
)

export default lastActionAtom
