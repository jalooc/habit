import { createMMKV, useMMKVString } from 'react-native-mmkv'
import { randomUUID } from 'expo-crypto'

export type DevLogEntry = {
  id: string,
  timestamp: number,
  label: string,
  payload?: unknown,
}

const ENTRIES_KEY = 'entries'

const storage = createMMKV({ id: 'dev-logs' })

const readEntries = (): DevLogEntry[] => {
  const raw = storage.getString(ENTRIES_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as DevLogEntry[] : []
  } catch {
    return []
  }
}

const toSerializable = (payload: unknown): unknown => {
  if (payload === undefined) return undefined
  try {
    return JSON.parse(JSON.stringify(payload))
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(payload)
  }
}

export const devLog = (label: string, payload?: unknown): void => {
  try {
    const entry: DevLogEntry = {
      id: randomUUID(),
      timestamp: Date.now(),
      label,
      payload,
    }
    console.log('[dev log]', entry)

    const entries = readEntries()
    const next = [...entries, toSerializable(entry)]
    storage.set(ENTRIES_KEY, JSON.stringify(next))
  } catch (error) {
    console.error('Error using devLog', { error })
    // Never let logging crash callers.
  }
}

export const clearDevLogs = (): void => {
  storage.remove(ENTRIES_KEY)
}

export const useDevLogs = (): DevLogEntry[] => {
  const [raw] = useMMKVString(ENTRIES_KEY, storage)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [...parsed as DevLogEntry[]].reverse()
  } catch {
    return []
  }
}
