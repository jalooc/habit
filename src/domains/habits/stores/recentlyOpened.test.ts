import { describe, expect, it, vi } from 'vitest'
import type { HabitsStore } from './habits'
import { getRecentlyOpened, keepShownOrder, withHabitOpened } from './recentlyOpened'

vi.mock('react-native-mmkv')
vi.mock('src/domains/devTools/utils/devLog', () => ({ devLog: () => undefined }))

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const makeHabits = (...ids: string[]): HabitsStore =>
  Object.fromEntries(ids.map(habitId => [habitId, { name: habitId }]))

describe('withHabitOpened', () => {
  it('puts the opened habit first', () => {
    const habits = makeHabits(id(1), id(2), id(3))

    expect(withHabitOpened([id(1), id(2)], id(3), habits)).toEqual([id(3), id(1), id(2)])
  })

  it('moves a re-opened habit to the top without duplicating it', () => {
    const habits = makeHabits(id(1), id(2), id(3))

    expect(withHabitOpened([id(1), id(2), id(3)], id(3), habits)).toEqual([id(3), id(1), id(2)])
  })

  it('keeps at most 5 habits, dropping the oldest', () => {
    const habits = makeHabits(...[1, 2, 3, 4, 5, 6].map(id))

    expect(withHabitOpened([id(1), id(2), id(3), id(4), id(5)], id(6), habits))
      .toEqual([id(6), id(1), id(2), id(3), id(4)])
  })

  it('drops ids whose habit no longer exists', () => {
    const habits = makeHabits(id(1), id(3))

    expect(withHabitOpened([id(2), id(1)], id(3), habits)).toEqual([id(3), id(1)])
  })
})

describe('keepShownOrder', () => {
  it('keeps a re-opened habit where the list showed it', () => {
    expect(keepShownOrder([id(2), id(1), id(3)], [id(1), id(2), id(3)])).toEqual([id(1), id(2), id(3)])
  })

  it('puts habits the list did not show on top, newest first', () => {
    expect(keepShownOrder([id(4), id(3), id(1), id(2)], [id(1), id(2)])).toEqual([id(4), id(3), id(1), id(2)])
  })

  it('drops shown habits that are no longer stored, e.g. after Clear', () => {
    expect(keepShownOrder([], [id(1), id(2)])).toEqual([])
  })
})

describe('getRecentlyOpened', () => {
  it('hides missing habits but keeps order', () => {
    const habits = makeHabits(id(1), id(3))

    expect(getRecentlyOpened([id(3), id(2), id(1)], habits)).toEqual([id(3), id(1)])
  })
})
