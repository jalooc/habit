import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDefaultStore } from 'jotai'

vi.mock('react-native-mmkv')
vi.mock('src/domains/devTools/utils/devLog', () => ({ devLog: () => undefined }))
vi.mock('src/domains/habits/utils/habitImages', () => ({ deleteImageFiles: vi.fn() }))

import habitsAtom, { type HabitsStore } from 'src/domains/habits/stores/habits'
import groupsAtom, { withHabitLinked } from 'src/domains/habits/stores/groups'
import lastActionAtom from 'src/domains/habits/stores/lastAction'
import { deleteImageFiles } from 'src/domains/habits/utils/habitImages'
import { actionHabit, deleteHabit, dismissLastAction, linkHabit, undoLastAction } from './habitActions'

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

describe('deleteHabit', () => {
  const OTHER_HABIT = 'habit-other'
  const IMAGES = ['one.jpg', 'two.jpg']
  const deletedHabit = {
    name: 'Shared',
    images: IMAGES,
    lastActioned: { timestamp: SERVED_YESTERDAY, type: 'completed' },
  } as const satisfies HabitsStore[string]

  beforeEach(() => {
    store.set(habitsAtom, {
      [SHARED_HABIT]: { ...deletedHabit, images: [...IMAGES] },
      [OTHER_HABIT]: { name: 'Other', images: ['other.jpg'] },
    })
    store.set(groupsAtom, groups => withHabitLinked(groups, FAST_ROTATION, OTHER_HABIT))
    vi.mocked(deleteImageFiles).mockClear()
  })

  it('removes the habit from every rotation it is in', () => {
    deleteHabit(SHARED_HABIT)

    expect(store.get(habitsAtom)).not.toHaveProperty(SHARED_HABIT)
    expect(store.get(groupsAtom)[FAST_ROTATION].habits).not.toHaveProperty(SHARED_HABIT)
    expect(store.get(groupsAtom)[SLOW_ROTATION].habits).not.toHaveProperty(SHARED_HABIT)
  })

  it('leaves the images on disk while the undo is on offer', () => {
    deleteHabit(SHARED_HABIT)

    expect(deleteImageFiles).not.toHaveBeenCalled()
  })

  it('undoes by restoring the habit, its queue history and every rotation', () => {
    deleteHabit(SHARED_HABIT)
    undoLastAction()

    expect(store.get(habitsAtom)[SHARED_HABIT]).toEqual(deletedHabit)
    expect(store.get(groupsAtom)[FAST_ROTATION].habits[SHARED_HABIT]).toBe(true)
    expect(store.get(groupsAtom)[SLOW_ROTATION].habits[SHARED_HABIT]).toBe(true)
    expect(store.get(lastActionAtom)).toBeUndefined()
  })

  it('keeps the images when undone', () => {
    deleteHabit(SHARED_HABIT)
    undoLastAction()

    expect(deleteImageFiles).not.toHaveBeenCalled()
  })

  it('does not resurrect a rotation deleted while the undo was pending', () => {
    deleteHabit(SHARED_HABIT)
    store.set(groupsAtom, ({ [FAST_ROTATION]: _deleted, ...groups }) => groups)

    undoLastAction()

    expect(store.get(groupsAtom)).not.toHaveProperty(FAST_ROTATION)
    expect(store.get(groupsAtom)[SLOW_ROTATION].habits[SHARED_HABIT]).toBe(true)
  })

  it('removes the images once the offer expires', () => {
    deleteHabit(SHARED_HABIT)
    dismissLastAction()

    expect(deleteImageFiles).toHaveBeenCalledExactlyOnceWith(IMAGES)
  })

  it('removes the images when a newer action replaces the offer', () => {
    deleteHabit(SHARED_HABIT)
    actionHabit(OTHER_HABIT, 'completed', FAST_ROTATION)

    expect(deleteImageFiles).toHaveBeenCalledExactlyOnceWith(IMAGES)
  })

  it('removes only the earlier habit\'s images when another habit is deleted next', () => {
    deleteHabit(SHARED_HABIT)
    deleteHabit(OTHER_HABIT)

    expect(deleteImageFiles).toHaveBeenCalledExactlyOnceWith(IMAGES)
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
