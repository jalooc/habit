import { atomWithStorage } from 'jotai/utils'
import { createMMKV } from 'react-native-mmkv'
import { serializeError } from 'serialize-error'
import { devLog } from 'src/domains/devTools/utils/devLog'

// The id is inherited from the Legend State persist plugin this replaced, so installs from before
// the switch keep their data.
export const mmkvStorage = createMMKV({ id: 'obsPersist' })

const UNREADABLE_INFIX = '.unreadable.'

export const getUnreadableCopies = () => Object.fromEntries(mmkvStorage.getAllKeys()
  .filter(key => key.includes(UNREADABLE_INFIX))
  .flatMap(key => {
    const raw = mmkvStorage.getString(key)
    return raw === undefined ? [] : [[key, raw] as const]
  }))

const getCopiesOf = (key: string) => Object.entries(getUnreadableCopies())
  .filter(([copyKey]) => copyKey.startsWith(`${key}${UNREADABLE_INFIX}`))

export const getUnreadableCopiesOf = (key: string) => getCopiesOf(key).map(([, copy]) => copy)

export default <Data>({
  key,
  initialValue,
  parse,
}: {
  key: string,
  initialValue: NoInfer<Data>,
  parse: (data: unknown, onUnreadable: (part: string, error: unknown) => unknown) => Data,
}) => {
  // Every write replaces the whole stored value, so a read that couldn't make sense of all of it
  // copies it aside before the next write can take it away. Each distinct value gets a key of its
  // own: a later lossy read may hold bytes that no longer contain what an earlier one lost.
  const keepAside = (raw: string) => {
    const keptKey = getCopiesOf(key).find(([, copy]) => copy === raw)?.[0]
    if (keptKey !== undefined) return keptKey

    const copyKey = `${key}${UNREADABLE_INFIX}${Date.now()}`
    mmkvStorage.set(copyKey, raw)
    return copyKey
  }

  const read = (): Data => {
    const raw = mmkvStorage.getString(key)
    if (raw === undefined) return initialValue

    const keepUnreadable = (whatHappened: string, error: unknown) => void devLog(
      `${whatHappened}, what was stored is kept under "${keepAside(raw)}"`,
      { error: serializeError(error) },
    )

    try {
      return parse(JSON.parse(raw), (part, error) => void keepUnreadable(`Left "${part}" out of "${key}"`, error))
    } catch (error) {
      // Not rethrown: this runs at import, so a throw would leave no way to reach the Backup screen.
      keepUnreadable(`Could not read "${key}", starting from the initial value`, error)
      return initialValue
    }
  }

  return atomWithStorage<Data>(
    key,
    initialValue,
    {
      getItem: read,
      setItem: (_key, value) => void mmkvStorage.set(key, JSON.stringify(value)),
      removeItem: () => void mmkvStorage.remove(key),
    },
    { getOnInit: true },
  )
}
