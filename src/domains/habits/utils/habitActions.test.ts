import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDefaultStore } from 'jotai'

vi.mock('react-native-mmkv')
vi.mock('src/domains/devTools/utils/devLog', () => ({ devLog: () => undefined }))

import habitsAtom from 'src/domains/habits/stores/habits'
import groupsAtom from 'src/domains/habits/stores/groups'
import lastActionAtom from 'src/domains/habits/stores/lastAction'
import { actionHabit, linkHabit, undoLastAction } from './habitActions'

const SHARED_HABIT = 'habit-shared'
const FAST_ROTATION = 'group-fast'
const SLOW_ROTATION = 'group-slow'

const SERVED_YESTERDAY = 1_700_000_000_000

const store = getDefaultStore()

beforeEach(() => {
  store.set(lastActionAtom, undefined)
  store.set(habitsAtom, { [SHARED_HABIT]: { name: 'Shared' }})
  store.set(groupsAtom, {
    [FAST_ROTATION]: {
      name: 'Fast',
      habits: { [SHARED_HABIT]: true },
      lastServedAt: SERVED_YESTERDAY,
    },
    [SLOW_ROTATION]: {
      name: 'Slow',
      habits: { [SHARED_HABIT]: true },
      lastServedAt: null,
    },
  })
})

describe('actionHabit', () => {
  it('serves only the rotation the tick was made in', () => {
    actionHabit(SHARED_HABIT, 'completed', FAST_ROTATION)

    expect(store.get(groupsAtom)[FAST_ROTATION].lastServedAt)
      .toBe(store.get(habitsAtom)[SHARED_HABIT].lastActioned?.timestamp)
    expect(store.get(groupsAtom)[SLOW_ROTATION].lastServedAt).toBeNull()
  })

  it('records the tick on the habit itself, where every rotation\'s queue reads it', () => {
    actionHabit(SHARED_HABIT, 'completed', FAST_ROTATION)

    expect(store.get(habitsAtom)[SHARED_HABIT].lastActioned?.type).toBe('completed')
  })

  it('lets a skip advance the habit without serving the rotation', () => {
    actionHabit(SHARED_HABIT, 'skipped', FAST_ROTATION)

    expect(store.get(habitsAtom)[SHARED_HABIT].lastActioned?.type).toBe('skipped')
    expect(store.get(groupsAtom)[FAST_ROTATION].lastServedAt).toBe(SERVED_YESTERDAY)
  })

  it('leaves a rotation that no longer exists alone rather than writing it back as a partial', () => {
    actionHabit(SHARED_HABIT, 'completed', 'group-deleted')

    expect(store.get(groupsAtom)).not.toHaveProperty('group-deleted')
  })
})

describe('undoLastAction', () => {
  it('restores both the habit and the rotation it served', () => {
    actionHabit(SHARED_HABIT, 'completed', FAST_ROTATION)
    undoLastAction()

    expect(store.get(habitsAtom)[SHARED_HABIT].lastActioned).toBeUndefined()
    expect(store.get(groupsAtom)[FAST_ROTATION].lastServedAt).toBe(SERVED_YESTERDAY)
    expect(store.get(lastActionAtom)).toBeUndefined()
  })

  it('restores a previous tick rather than clearing it', () => {
    actionHabit(SHARED_HABIT, 'completed', FAST_ROTATION)
    const firstTick = store.get(habitsAtom)[SHARED_HABIT].lastActioned

    actionHabit(SHARED_HABIT, 'completed', SLOW_ROTATION)
    undoLastAction()

    expect(store.get(habitsAtom)[SHARED_HABIT].lastActioned).toEqual(firstTick)
    expect(store.get(groupsAtom)[SLOW_ROTATION].lastServedAt).toBeNull()
  })

  it('does not resurrect a rotation deleted while the undo was pending', () => {
    actionHabit(SHARED_HABIT, 'completed', FAST_ROTATION)
    store.set(groupsAtom, ({ [FAST_ROTATION]: _deleted, ...groups }) => groups)

    undoLastAction()

    expect(store.get(groupsAtom)).not.toHaveProperty(FAST_ROTATION)
  })

  it('does not resurrect a habit deleted while the undo was pending', () => {
    actionHabit(SHARED_HABIT, 'completed', FAST_ROTATION)
    store.set(habitsAtom, ({ [SHARED_HABIT]: _deleted, ...habits }) => habits)

    undoLastAction()

    expect(store.get(habitsAtom)).not.toHaveProperty(SHARED_HABIT)
  })
})

describe('linkHabit', () => {
  const UNLINKED = 'habit-new'

  beforeEach(() => {
    store.set(habitsAtom, habits => ({ ...habits, [UNLINKED]: { name: 'New habit' }}))
  })

  it('adds the habit to the rotation', () => {
    linkHabit(UNLINKED, FAST_ROTATION)

    expect(store.get(groupsAtom)[FAST_ROTATION].habits[UNLINKED]).toBe(true)
  })

  it('records a linked action for undo', () => {
    linkHabit(UNLINKED, FAST_ROTATION)

    expect(store.get(lastActionAtom)).toMatchObject({
      type: 'linked',
      habitId: UNLINKED,
      habitName: 'New habit',
      groupId: FAST_ROTATION,
    })
  })

  it('undoes by removing membership only', () => {
    linkHabit(UNLINKED, FAST_ROTATION)
    undoLastAction()

    expect(store.get(groupsAtom)[FAST_ROTATION].habits).not.toHaveProperty(UNLINKED)
    expect(store.get(habitsAtom)[UNLINKED]).toEqual({ name: 'New habit' })
  })
})
