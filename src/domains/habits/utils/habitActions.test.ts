import { beforeEach, describe, expect, it, vi } from 'vitest'

// The stores are stood up as bare observables: `habitActions` is about which record a tick writes
// to, and persistence would only drag MMKV into a node test to answer that.
vi.mock('src/domains/habits/stores/habits', async () => {
  const { observable } = await import('@legendapp/state')
  return { default: observable({}) }
})
vi.mock('src/domains/habits/stores/groups', async () => {
  const { observable } = await import('@legendapp/state')
  return { default: observable({}) }
})

import habits$ from 'src/domains/habits/stores/habits'
import groups$ from 'src/domains/habits/stores/groups'
import lastAction$ from 'src/domains/habits/stores/lastAction'
import { actionHabit, undoLastAction } from './habitActions'

const SHARED_HABIT = 'habit-shared'
const FAST_ROTATION = 'group-fast'
const SLOW_ROTATION = 'group-slow'

const SERVED_YESTERDAY = 1_700_000_000_000

beforeEach(() => {
  lastAction$.set(undefined)
  habits$.set({ [SHARED_HABIT]: { name: 'Shared' }})
  groups$.set({
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

    expect(groups$[FAST_ROTATION].lastServedAt.peek()).toBe(habits$[SHARED_HABIT].lastActioned.timestamp.peek())
    expect(groups$[SLOW_ROTATION].lastServedAt.peek()).toBeNull()
  })

  it('records the tick on the habit itself, where every rotation\'s queue reads it', () => {
    actionHabit(SHARED_HABIT, 'completed', FAST_ROTATION)

    expect(habits$[SHARED_HABIT].lastActioned.type.peek()).toBe('completed')
  })

  it('lets a skip advance the habit without serving the rotation', () => {
    actionHabit(SHARED_HABIT, 'skipped', FAST_ROTATION)

    expect(habits$[SHARED_HABIT].lastActioned.type.peek()).toBe('skipped')
    expect(groups$[FAST_ROTATION].lastServedAt.peek()).toBe(SERVED_YESTERDAY)
  })

  it('leaves a rotation that no longer exists alone rather than writing it back as a partial', () => {
    actionHabit(SHARED_HABIT, 'completed', 'group-deleted')

    expect(groups$.peek()).not.toHaveProperty('group-deleted')
  })
})

describe('undoLastAction', () => {
  it('restores both the habit and the rotation it served', () => {
    actionHabit(SHARED_HABIT, 'completed', FAST_ROTATION)
    undoLastAction()

    expect(habits$[SHARED_HABIT].lastActioned.peek()).toBeUndefined()
    expect(groups$[FAST_ROTATION].lastServedAt.peek()).toBe(SERVED_YESTERDAY)
    expect(lastAction$.peek()).toBeUndefined()
  })

  it('restores a previous tick rather than clearing it', () => {
    actionHabit(SHARED_HABIT, 'completed', FAST_ROTATION)
    const firstTick = habits$[SHARED_HABIT].lastActioned.peek()

    actionHabit(SHARED_HABIT, 'completed', SLOW_ROTATION)
    undoLastAction()

    expect(habits$[SHARED_HABIT].lastActioned.peek()).toEqual(firstTick)
    expect(groups$[SLOW_ROTATION].lastServedAt.peek()).toBeNull()
  })

  it('does not resurrect a rotation deleted while the undo was pending', () => {
    actionHabit(SHARED_HABIT, 'completed', FAST_ROTATION)
    groups$[FAST_ROTATION].delete()

    undoLastAction()

    expect(groups$.peek()).not.toHaveProperty(FAST_ROTATION)
  })
})
