import { describe, expect, it, vi } from 'vitest'
import { getDefaultStore } from 'jotai'
import { z } from 'zod'

// Drives the real persistence pipeline over an in-memory stand-in for MMKV. The point of this file
// is that a stored table can hold groups of different ages at once — a group written since the
// service record shipped next to one untouched since before it, and one that can't be read at
// all — and every readable one has to come up. Getting that wrong wiped the store the first time
// rotation-scoped turns shipped.
vi.mock('react-native-mmkv')
vi.mock('src/domains/devTools/utils/devLog', () => ({ devLog: () => undefined }))

// The atom reads storage the moment it is created, which is when the store module is imported, so
// the table has to be on disk before that import runs.
const {
  storage,
  STORED_GROUPS,
  WRITTEN_SINCE,
  UNTOUCHED_SINCE,
  UNREADABLE,
  HABIT_ID,
  SERVED_AT,
} = await vi.hoisted(async () => {
  const { mmkvStorage } = await import('src/domains/misc/utils/atomWithMMKV')

  const fixture = {
    WRITTEN_SINCE: '3b241101-e2bb-4255-8caf-4136c566a962',
    UNTOUCHED_SINCE: '9f1a7867-6a6a-4d2c-9a52-8f4d1f6f8a01',
    UNREADABLE: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    HABIT_ID: '1b4e28ba-2fa1-11d2-883f-0016d3cca427',
    SERVED_AT: 5_000,
  }

  const storedGroups = JSON.stringify({
    [fixture.WRITTEN_SINCE]: { name: 'Written since', habits: {}, lastServedAt: fixture.SERVED_AT },
    [fixture.UNTOUCHED_SINCE]: { name: 'Untouched since', habits: { [fixture.HABIT_ID]: true }},
    [fixture.UNREADABLE]: { habits: {}, lastServedAt: null },
  })

  const storage = mmkvStorage
  storage.set('habits', JSON.stringify({
    [fixture.HABIT_ID]: { name: 'Shared', lastActioned: { timestamp: 8_000, type: 'completed' }},
  }))
  storage.set('groups', storedGroups)

  return { storage, STORED_GROUPS: storedGroups, ...fixture }
})

import groupsAtom, { withGroupUpdated } from './groups'
import { getUnreadableCopies } from 'src/domains/misc/utils/atomWithMMKV'

const store = getDefaultStore()

const storedGroups = () => z.record(z.string(), z.unknown()).parse(JSON.parse(storage.getString('groups') ?? '{}'))

const renameWrittenSince = () =>
  void store.set(groupsAtom, groups => withGroupUpdated(groups, WRITTEN_SINCE, group => ({ ...group, name: 'Renamed' })))

describe('loading a table whose groups are not all the same version', () => {
  it('loads both readable groups instead of failing the whole store', () => {
    expect(Object.keys(store.get(groupsAtom))).toEqual([WRITTEN_SINCE, UNTOUCHED_SINCE])
  })

  it('keeps the service record of the group that already had one', () => {
    expect(store.get(groupsAtom)[WRITTEN_SINCE].lastServedAt).toBe(SERVED_AT)
  })

  it('brings the older group up as never served, not as served by a habit it shares', () => {
    // its habit carries a completion from 8_000, and reading that here is exactly the
    // cross-rotation credit the service record exists to stop
    expect(store.get(groupsAtom)[UNTOUCHED_SINCE].lastServedAt).toBeNull()
  })

  it('settles the whole table in the current shape on the first change to any group', () => {
    // the load itself writes nothing back, so the stored group stays a version behind until then
    expect(storedGroups()[UNTOUCHED_SINCE]).not.toHaveProperty('lastServedAt')

    renameWrittenSince()

    expect(storedGroups()[UNTOUCHED_SINCE]).toEqual({
      name: 'Untouched since',
      habits: { [HABIT_ID]: true },
      lastServedAt: null,
    })
    // the group that couldn't be read is dropped from disk too, but its bytes stay aside
    expect(storedGroups()).not.toHaveProperty(UNREADABLE)
    expect(Object.values(getUnreadableCopies())).toEqual([STORED_GROUPS])
  })
})

describe('loading a table holding a group that cannot be read', () => {
  it('sets what was stored aside once, however many times the table is read', () => {
    // the first subscriber makes atomWithStorage read storage a second time
    const unsubscribe = store.sub(groupsAtom, () => undefined)
    unsubscribe()

    expect(Object.values(getUnreadableCopies())).toEqual([STORED_GROUPS])
  })
})
