import { describe, expect, it, vi } from 'vitest'

import { parsePersistedHabits } from './habits'

vi.mock('@legendapp/state/persist-plugins/mmkv', () => (({ ObservablePersistMMKV: vi.fn() })))
vi.mock('src/domains/devTools/utils/devLog', () => ({ devLog: () => undefined }))

const HABIT_ID = '3b241101-e2bb-4255-8caf-4136c566a962'

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
    expect(parsePersistedHabits(habits)).toEqual(habits)
  })

  it('parses a minimal habit unchanged', () => {
    const habits = { [HABIT_ID]: { name: 'Stretch' }}
    expect(parsePersistedHabits(habits)).toEqual(habits)
  })
})

describe('v1 data (lastCompleted ISO string)', () => {
  it('migrates lastCompleted into a completed lastActioned', () => {
    const result = parsePersistedHabits({
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
    const migrated = parsePersistedHabits({
      [HABIT_ID]: { name: 'Stretch', lastCompleted: '2026-06-01T09:30:00.000Z' },
    })
    expect(parsePersistedHabits(migrated)).toEqual(migrated)
  })

  it('migrates a habit without lastCompleted as-is', () => {
    expect(parsePersistedHabits({ [HABIT_ID]: { name: 'Stretch' }})).toEqual({
      [HABIT_ID]: { name: 'Stretch' },
    })
  })
})

describe('invalid data', () => {
  it('throws when neither schema version matches', () => {
    expect(() => parsePersistedHabits({ [HABIT_ID]: { lastCompleted: 'not-a-date' }})).toThrow()
  })

  it('throws on a non-record payload', () => {
    expect(() => parsePersistedHabits(null)).toThrow()
  })
})
