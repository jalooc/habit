import {
  createMMKVStorageAdapter,
  useRozeniteStoragePlugin,
} from '@rozenite/storage-plugin'
import { createMMKV } from 'react-native-mmkv'

const legendStatePersistMMKV = createMMKV({
  id: 'obsPersist', // the plugin's id as used in from node_modules/@legendapp/state/persist-plugins/mmkv.mjs:31
})

const storages = [
  createMMKVStorageAdapter({
    storages: {
      legendStatePersistMMKV,
    },
  }),
]

export default () => useRozeniteStoragePlugin({ storages })
