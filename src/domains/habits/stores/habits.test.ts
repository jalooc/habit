import { describe, expect, it, vi } from 'vitest'

import { parsePersistedHabits, withHabitUpdated } from './habits'

vi.mock('react-native-mmkv')
vi.mock('src/domains/devTools/utils/devLog', () => ({ devLog: () => undefined }))

const HABIT_ID = '3b241101-e2bb-4255-8caf-4136c566a962'
const OTHER_HABIT_ID = '9f1a7867-6a6a-4d2c-9a52-8f4d1f6f8a01'

const parseStrictly = (value: unknown) => parsePersistedHabits(value, (_habitId, error) => {
  throw error
})

describe('v2 data (current shape)', () => {
  it('parses a habit with lastActioned unchanged', () => {
    const habits = {
      [HABIT_ID]: {
        name: 'Stretch',
        description: 'Neck and back',
        images: ['a.jpg'],
        lastActioned: { timestamp: 1750000000000, type: 'completed' },
      },
    }
    expect(parseStrictly(habits)).toEqual(habits)
  })

  it('parses a minimal habit unchanged', () => {
    const habits = { [HABIT_ID]: { name: 'Stretch' }}
    expect(parseStrictly(habits)).toEqual(habits)
  })
})

describe('v1 data (lastCompleted ISO string)', () => {
  it('migrates lastCompleted into a completed lastActioned', () => {
    const result = parseStrictly({
      [HABIT_ID]: { name: 'Stretch', lastCompleted: '2026-06-01T09:30:00.000Z' },
    })
    expect(result[HABIT_ID]).toEqual({
      name: 'Stretch',
      lastActioned: {
        timestamp: new Date('2026-06-01T09:30:00.000Z').getTime(),
        type: 'completed',
      },
    })
  })

  it('re-parses its own migration output (the shape persisted after the next save)', () => {
    const migrated = parseStrictly({
      [HABIT_ID]: { name: 'Stretch', lastCompleted: '2026-06-01T09:30:00.000Z' },
    })
    expect(parseStrictly(migrated)).toEqual(migrated)
  })

  it('migrates a habit without lastCompleted as-is', () => {
    expect(parseStrictly({ [HABIT_ID]: { name: 'Stretch' }})).toEqual({
      [HABIT_ID]: { name: 'Stretch' },
    })
  })
})

// The store that preceded this one wrote one field at a time, so a v1 habit ticked since holds its
// `lastCompleted` next to a `lastActioned`. No single version describes it, and rejecting it lost
// every habit at once.
describe('a habit whose fields are from different versions', () => {
  it('keeps the newer record of when it was last actioned', () => {
    const lastActioned = { timestamp: new Date('2026-07-01T08:00:00.000Z').getTime(), type: 'skipped' }

    expect(parseStrictly({
      [HABIT_ID]: { name: 'Stretch', lastCompleted: '2026-06-01T09:30:00.000Z', lastActioned },
    })).toEqual({ [HABIT_ID]: { name: 'Stretch', lastActioned }})
  })
})

describe('a habit that cannot be read', () => {
  const readable = { name: 'Readable' }

  it.each([
    ['is missing its name', { lastCompleted: '2026-06-01T09:30:00.000Z' }],
    ['holds a key no version had', { name: 'Stretch', stowaway: 1 }],
    ['holds a lastCompleted that is no date', { name: 'Stretch', lastCompleted: 'not-a-date' }],
  ])('is left out of the table when it %s', (_, unreadable) => {
    expect(parsePersistedHabits({ [HABIT_ID]: unreadable, [OTHER_HABIT_ID]: readable }, () => undefined))
      .toEqual({ [OTHER_HABIT_ID]: readable })
  })

  it('is reported by its id', () => {
    const onUnreadable = vi.fn()
    parsePersistedHabits({ [HABIT_ID]: {}}, onUnreadable)

    expect(onUnreadable).toHaveBeenCalledExactlyOnceWith(HABIT_ID, expect.anything())
  })

  it('is one stored under anything but a habit id, too', () => {
    const onUnreadable = vi.fn()

    expect(parsePersistedHabits({ 'not-a-habit-id': readable }, onUnreadable)).toEqual({})
    expect(onUnreadable).toHaveBeenCalledExactlyOnceWith('not-a-habit-id', expect.anything())
  })
})

describe('a payload that is not a table', () => {
  it('throws', () => {
    expect(() => parsePersistedHabits(null, () => undefined)).toThrow()
  })
})

describe('updating a habit', () => {
  const habits = { [HABIT_ID]: { name: 'Stretch' }}

  it('applies the update to that habit', () => {
    expect(withHabitUpdated(habits, HABIT_ID, habit => ({ ...habit, name: 'Hollow hold' }))[HABIT_ID].name)
      .toBe('Hollow hold')
  })

  it('leaves a habit that is not there alone rather than storing a nameless partial', () => {
    expect(withHabitUpdated(habits, 'habit-gone', habit => ({ ...habit, description: 'gone' }))).toBe(habits)
  })
})
