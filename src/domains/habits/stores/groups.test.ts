import { describe, expect, it, vi } from 'vitest'

import { parsePersistedGroups } from './groups'

vi.mock('@legendapp/state/persist-plugins/mmkv', () => (({ ObservablePersistMMKV: vi.fn() })))
vi.mock('src/domains/devTools/utils/devLog', () => ({ devLog: () => undefined }))

const GROUP_ID = '3b241101-e2bb-4255-8caf-4136c566a962'
const OTHER_GROUP_ID = '9f1a7867-6a6a-4d2c-9a52-8f4d1f6f8a01'

const rrule = (rule: string) => `DTSTART;TZID=Europe/Warsaw:20260304T070000\nRRULE:${rule}`

const table = (group: Record<string, unknown>) => ({ [GROUP_ID]: group })

describe('a group already in the current shape', () => {
  it('parses unchanged', () => {
    const groups = table({
      name: 'Morning',
      habits: { 'habit-1': true },
      recurrence: { type: 'times-per-day', value: 3 },
      lastServedAt: 1_700_000_000_000,
    })
    expect(parsePersistedGroups(groups)).toEqual(groups)
  })

  it('parses a recurrence with specificDays unchanged', () => {
    const groups = table({
      name: 'Morning',
      habits: {},
      recurrence: {
        type: 'times-per-day',
        value: 1,
        specificDays: { mo: true, tu: false, we: true, th: false, fr: true, sa: false, su: false },
      },
      lastServedAt: null,
    })
    expect(parsePersistedGroups(groups)).toEqual(groups)
  })

  it('parses a group without recurrence unchanged', () => {
    const groups = table({ name: 'Loose', habits: { 'habit-1': true }, lastServedAt: null })
    expect(parsePersistedGroups(groups)).toEqual(groups)
  })
})

// Legend State never writes a load transform's output back and afterwards persists one path at a
// time, so a group's fields migrate independently — and a group can hold a field from one version
// beside a field from another. Discriminating a version per group could not read that, which is
// how the store came to reject data it had written itself.
describe('a group whose fields are from different versions', () => {
  it('reads a v1 RRULE string alongside a service record written since', () => {
    const parsed = parsePersistedGroups(table({
      name: 'Morning',
      habits: { 'habit-1': true },
      recurrence: rrule('FREQ=DAILY;BYHOUR=9,13,17;BYMINUTE=0'),
      lastServedAt: 7_000,
    }))

    expect(parsed[GROUP_ID]).toEqual({
      name: 'Morning',
      habits: { 'habit-1': true },
      recurrence: { type: 'times-per-day', value: 3 },
      lastServedAt: 7_000,
    })
  })

  it('brings a group with no service record up as never served', () => {
    const parsed = parsePersistedGroups(table({
      name: 'Morning',
      habits: {},
      recurrence: { type: 'times-per-day', value: 3 },
    }))

    expect(parsed[GROUP_ID].lastServedAt).toBeNull()
  })

  it('reads a table whose groups are in different shapes', () => {
    const parsed = parsePersistedGroups({
      [GROUP_ID]: { name: 'Written since', habits: {}, lastServedAt: 5_000 },
      [OTHER_GROUP_ID]: { name: 'Untouched since', habits: { 'habit-1': true }},
    })

    expect(parsed[GROUP_ID].lastServedAt).toBe(5_000)
    expect(parsed[OTHER_GROUP_ID].lastServedAt).toBeNull()
  })

  it('answers the same way however many times it runs', () => {
    // the normalised shape never reaches storage, so this runs again on every launch until an
    // ordinary change happens to rewrite the group
    const groups = table({ name: 'g', habits: {}, recurrence: rrule('FREQ=HOURLY;INTERVAL=4') })
    expect(parsePersistedGroups(groups)).toEqual(parsePersistedGroups(groups))
  })
})

describe('v1 recurrence strings', () => {
  const migrated = (rule: string) =>
    parsePersistedGroups(table({ name: 'g', habits: {}, recurrence: rrule(rule) }))[GROUP_ID].recurrence

  it('migrates a daily-with-hours rule to times-per-day', () => {
    expect(migrated('FREQ=DAILY;BYHOUR=9,13,17;BYMINUTE=0')).toEqual({ type: 'times-per-day', value: 3 })
  })

  it('migrates an hourly rule to every-x-hours', () => {
    expect(migrated('FREQ=HOURLY;INTERVAL=4')).toEqual({ type: 'every-x-hours', value: 4 })
  })

  it('migrates a weekly rule to times-per-week with specificDays', () => {
    expect(migrated('FREQ=WEEKLY;BYDAY=MO,FR')).toEqual({
      type: 'times-per-week',
      value: 2,
      specificDays: { mo: true, tu: false, we: false, th: false, fr: true, sa: false, su: false },
    })
  })

  it('migrates a monthly rule to times-per-month', () => {
    expect(migrated('FREQ=MONTHLY;BYMONTHDAY=1,15')).toEqual({ type: 'times-per-month', value: 2 })
  })

  it('re-parses its own output (the shape persisted after the next save)', () => {
    const result = parsePersistedGroups({
      [GROUP_ID]: { name: 'a', habits: {}, recurrence: rrule('FREQ=WEEKLY;BYDAY=MO,FR') },
      [OTHER_GROUP_ID]: { name: 'b', habits: { 'habit-2': true }},
    })
    expect(parsePersistedGroups(JSON.parse(JSON.stringify(result)))).toEqual(result)
  })
})

describe('invalid data', () => {
  it('throws on an unknown key rather than silently dropping it', () => {
    expect(() => parsePersistedGroups(table({
      name: 'g', habits: {}, lastServedAt: null, stowaway: 1,
    }))).toThrow()
  })

  it('throws when a group is missing what every version required', () => {
    expect(() => parsePersistedGroups(table({ habits: {}}))).toThrow()
  })

  it('throws on a non-record payload', () => {
    expect(() => parsePersistedGroups('nonsense')).toThrow()
  })
})
