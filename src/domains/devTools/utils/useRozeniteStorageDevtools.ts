import {
  createMMKVStorageAdapter,
  useRozeniteStoragePlugin,
} from '@rozenite/storage-plugin'
import { mmkvStorage } from 'src/domains/misc/utils/atomWithMMKV'

const storages = [
  createMMKVStorageAdapter({
    storages: {
      mmkvStorage,
    },
  }),
]

export default () => useRozeniteStoragePlugin({ storages })
