import { groupBy, sortBy } from 'remeda'
import type { HabitsStore } from 'src/domains/habits/stores/habits'
import type { GroupsStore } from 'src/domains/habits/stores/groups'
import orderQueue from 'src/domains/habits/utils/orderQueue'
import { formatQueuePlace } from 'src/domains/habits/utils/queuePlace'

// One card per habit, however many rotations it sits in, with its place in each rotation's queue.
const buildHabitCards = (habits: HabitsStore, groups: GroupsStore) => {
  const places = Object.entries(groups).flatMap(([groupId, group]) =>
    orderQueue(Object.keys(group.habits), habits).map((habitId, index, queue) => ({
      habitId,
      groupId,
      groupName: group.name,
      index,
      count: queue.length,
    })))
  const placesByHabit = groupBy(places, place => place.habitId)

  return Object.fromEntries(Object.entries(habits).map(([habitId, { name }]) => {
    const rotations = sortBy(placesByHabit[habitId] ?? [], place => place.index)

    return [habitId, { habitId, name, rotations }]
  }))
}

export default buildHabitCards

export type HabitCard = ReturnType<typeof buildHabitCards>[string]

export const isUpNextAnywhere = (card: HabitCard) => card.rotations.some(rotation => rotation.index === 0)

export const describeHabitCard = ({ name, rotations }: HabitCard) => [
  name,
  ...rotations.map(({ groupName, index, count }) => `${groupName}, ${formatQueuePlace(index, count)}`),
].map(sentence => `${sentence}.`).join(' ')
