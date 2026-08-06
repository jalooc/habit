import { beforeAll, describe, expect, it, vi } from 'vitest'

// Drives the real Legend State persist pipeline, swapping only the storage backend: the
// local-storage plugin caches and writes back exactly the way the MMKV one does. The pipeline is
// the point of this file. A load transform's output is merged into the observable but never
// written back, and Legend State afterwards diffs observable against observable, never against
// storage — so a table can hold groups in two shapes at once, and no migration can settle itself.
// Getting that wrong wiped the store the first time rotation-scoped turns shipped.
vi.mock('@legendapp/state/persist-plugins/mmkv', async () => ({
  ObservablePersistMMKV: (await import('@legendapp/state/persist-plugins/local-storage'))
    .ObservablePersistLocalStorage,
}))
vi.mock('src/domains/devTools/utils/devLog', () => ({ devLog: () => undefined }))

import groups$ from './groups'

const WRITTEN_SINCE = '3b241101-e2bb-4255-8caf-4136c566a962'
const UNTOUCHED_SINCE = '9f1a7867-6a6a-4d2c-9a52-8f4d1f6f8a01'
const HABIT_ID = '1b4e28ba-2fa1-11d2-883f-0016d3cca427'

const SERVED_AT = 5_000

const storage = new Map<string, string>()

const storedGroups = () => JSON.parse(storage.get('groups') ?? '{}') as Record<string, unknown>

const flushPersistence = () => new Promise(resolve => void setTimeout(resolve, 0))

beforeAll(async () => {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  })

  storage.set('habits', JSON.stringify({
    [HABIT_ID]: { name: 'Shared', lastActioned: { timestamp: 8_000, type: 'completed' }},
  }))
  storage.set('groups', JSON.stringify({
    [WRITTEN_SINCE]: { name: 'Written since', habits: {}, lastServedAt: SERVED_AT },
    [UNTOUCHED_SINCE]: { name: 'Untouched since', habits: { [HABIT_ID]: true }},
  }))

  groups$.peek()
  await flushPersistence()
})

describe('loading a table whose groups are not all the same version', () => {
  it('loads both groups instead of failing the whole store', () => {
    expect(Object.keys(groups$.peek())).toEqual([WRITTEN_SINCE, UNTOUCHED_SINCE])
  })

  it('keeps the service record of the group that already had one', () => {
    expect(groups$[WRITTEN_SINCE].lastServedAt.peek()).toBe(SERVED_AT)
  })

  it('brings the older group up as never served, not as served by a habit it shares', () => {
    // its habit carries a completion from 8_000, and reading that here is exactly the
    // cross-rotation credit v3 exists to stop
    expect(groups$[UNTOUCHED_SINCE].lastServedAt.peek()).toBeNull()
  })

  it('serving a migrated rotation is what settles its shape on disk', () => {
    // the load itself writes nothing back, so the stored group stays a version behind until an
    // ordinary change touches it — which is why the migration has to be stable under re-running
    expect(storedGroups()[UNTOUCHED_SINCE]).not.toHaveProperty('lastServedAt')

    groups$[UNTOUCHED_SINCE].lastServedAt.set(9_000)

    return flushPersistence().then(() => {
      expect(storedGroups()[UNTOUCHED_SINCE]).toEqual({
        name: 'Untouched since',
        habits: { [HABIT_ID]: true },
        lastServedAt: 9_000,
      })
    })
  })
})
