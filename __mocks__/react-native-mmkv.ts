// An in-memory stand-in for the native store, so tests can drive the real persistence pipeline.
// Instances sharing an id share their values, as they do natively.
const storesById = new Map<string, Map<string, string>>()
const listenersById = new Map<string, Set<(key: string) => void>>()

const DEFAULT_ID = 'mmkv.default'

export const createMMKV = ({ id = DEFAULT_ID }: { id?: string } = {}) => {
  const values = storesById.get(id) ?? new Map<string, string>()
  const listeners = listenersById.get(id) ?? new Set<(key: string) => void>()
  storesById.set(id, values)
  listenersById.set(id, listeners)

  const notify = (key: string) => void listeners.forEach(listener => void listener(key))

  return {
    getString: (key: string) => values.get(key),
    getAllKeys: () => [...values.keys()],
    set: (key: string, value: string) => {
      values.set(key, value)
      notify(key)
    },
    remove: (key: string) => {
      const existed = values.delete(key)
      notify(key)
      return existed
    },
    addOnValueChangedListener: (listener: (key: string) => void) => {
      listeners.add(listener)
      return { remove: () => void listeners.delete(listener) }
    },
  }
}
