import { describe, expect, it, vi } from 'vitest'

import { parsePersistedGroups } from './groups'

vi.mock('@legendapp/state/persist-plugins/mmkv', () => (({ ObservablePersistMMKV: vi.fn() })))
vi.mock('src/domains/devTools/utils/devLog', () => ({ devLog: () => undefined }))

const GROUP_ID = '3b241101-e2bb-4255-8caf-4136c566a962'
const OTHER_GROUP_ID = '9f1a7867-6a6a-4d2c-9a52-8f4d1f6f8a01'

const rrule = (rule: string) => `DTSTART;TZID=Europe/Warsaw:20260304T070000\nRRULE:${rule}`

describe('v2 data (current shape)', () => {
  it('parses a group with an object recurrence unchanged', () => {
    const groups = {
      [GROUP_ID]: {
        name: 'Morning',
        habits: { 'habit-1': true },
        recurrence: { type: 'times-per-day', value: 3 },
      },
    }
    expect(parsePersistedGroups(groups)).toEqual(groups)
  })

  it('parses a recurrence with specificDays unchanged', () => {
    const groups = {
      [GROUP_ID]: {
        name: 'Morning',
        habits: {},
        recurrence: {
          type: 'times-per-day',
          value: 1,
          specificDays: { mo: true, tu: false, we: true, th: false, fr: true, sa: false, su: false },
        },
      },
    }
    expect(parsePersistedGroups(groups)).toEqual(groups)
  })

  it('parses a group without recurrence unchanged', () => {
    const groups = { [GROUP_ID]: { name: 'Loose', habits: { 'habit-1': true }}}
    expect(parsePersistedGroups(groups)).toEqual(groups)
  })
})

describe('v1 data (recurrence as an RRULE string)', () => {
  it('migrates a daily-with-hours rule to times-per-day', () => {
    const result = parsePersistedGroups({
      [GROUP_ID]: {
        name: 'Morning',
        habits: { 'habit-1': true },
        recurrence: rrule('FREQ=DAILY;BYHOUR=9,13,17;BYMINUTE=0'),
      },
    })
    expect(result[GROUP_ID]).toEqual({
      name: 'Morning',
      habits: { 'habit-1': true },
      recurrence: { type: 'times-per-day', value: 3 },
    })
  })

  it('migrates an hourly rule to every-x-hours', () => {
    const result = parsePersistedGroups({
      [GROUP_ID]: { name: 'g', habits: {}, recurrence: rrule('FREQ=HOURLY;INTERVAL=4') },
    })
    expect(result[GROUP_ID].recurrence).toEqual({ type: 'every-x-hours', value: 4 })
  })

  it('migrates a weekly rule to times-per-week with specificDays', () => {
    const result = parsePersistedGroups({
      [GROUP_ID]: { name: 'g', habits: {}, recurrence: rrule('FREQ=WEEKLY;BYDAY=MO,FR') },
    })
    expect(result[GROUP_ID].recurrence).toEqual({
      type: 'times-per-week',
      value: 2,
      specificDays: { mo: true, tu: false, we: false, th: false, fr: true, sa: false, su: false },
    })
  })

  it('migrates a monthly rule to times-per-month', () => {
    const result = parsePersistedGroups({
      [GROUP_ID]: { name: 'g', habits: {}, recurrence: rrule('FREQ=MONTHLY;BYMONTHDAY=1,15') },
    })
    expect(result[GROUP_ID].recurrence).toEqual({ type: 'times-per-month', value: 2 })
  })

  it('migrates a mix of groups with and without recurrence', () => {
    const result = parsePersistedGroups({
      [GROUP_ID]: { name: 'a', habits: {}, recurrence: rrule('FREQ=DAILY;BYHOUR=9;BYMINUTE=0') },
      [OTHER_GROUP_ID]: { name: 'b', habits: { 'habit-2': true }},
    })
    expect(result[GROUP_ID].recurrence).toEqual({ type: 'times-per-day', value: 1 })
    expect(result[OTHER_GROUP_ID]).toEqual({ name: 'b', habits: { 'habit-2': true }})
  })

  it('re-parses its own migration output (the shape persisted after the next save)', () => {
    const migrated = parsePersistedGroups({
      [GROUP_ID]: { name: 'a', habits: {}, recurrence: rrule('FREQ=WEEKLY;BYDAY=MO,FR') },
      [OTHER_GROUP_ID]: { name: 'b', habits: { 'habit-2': true }},
    })
    expect(parsePersistedGroups(JSON.parse(JSON.stringify(migrated)))).toEqual(migrated)
  })
})

describe('invalid data', () => {
  it('throws when neither schema version matches', () => {
    expect(() => parsePersistedGroups({ [GROUP_ID]: { habits: {}}})).toThrow()
  })

  it('throws on a non-record payload', () => {
    expect(() => parsePersistedGroups('nonsense')).toThrow()
  })
})
