import { Directory, File, Paths } from 'expo-file-system'
import { zip } from 'react-native-zip-archive'
import { randomUUID } from 'expo-crypto'
import { getDefaultStore } from 'jotai'
import habitsAtom from 'src/domains/habits/stores/habits'
import groupsAtom from 'src/domains/habits/stores/groups'
import dayBoundariesAtom from 'src/domains/misc/stores/dayBoundaries'
import { getUnreadableCopies } from 'src/domains/misc/utils/atomWithMMKV'
import { imagesDir } from 'src/domains/habits/utils/habitImages'
import { devLog } from 'src/domains/devTools/utils/devLog'
import { serializeError } from 'serialize-error'
import { toNativePath } from './backupUtils'

export const exportData = async () => {
  const store = getDefaultStore()

  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    habits: store.get(habitsAtom),
    groups: store.get(groupsAtom),
    dayBoundaries: store.get(dayBoundariesAtom),
    // what the app couldn't read lives only on this device otherwise; import ignores it
    unreadable: getUnreadableCopies(),
  }

  const tempDir = new Directory(Paths.cache, `export-${randomUUID()}`)
  tempDir.create()
  const zipCacheFile = new File(Paths.cache, `habit-backup-${formatFilenameTimestamp(new Date())}.zip`)

  try {
    if (imagesDir.exists) { // images are optional; if none added yet, zip will only contain data.json
      await imagesDir.copy(new Directory(tempDir, 'images'))
      devLog('Exporting with images:', imagesDir.list().map(i => i.name))
    } else {
      devLog('Exporting without images directory, as it does not exist.')
    }

    new File(tempDir, 'data.json').write(JSON.stringify(payload, null, 2))

    await zip(toNativePath(tempDir.uri), toNativePath(zipCacheFile.uri))
    tempDir.delete()

    const destDir = await pickDirectory()
    if (!destDir) {
      devLog('Export cancelled: no destination directory selected.')
      zipCacheFile.delete()
      return { saved: false as const }
    }

    const zipBytes = new Uint8Array(await zipCacheFile.arrayBuffer())
    zipCacheFile.delete()
    const destFile = destDir.createFile(zipCacheFile.name, 'application/zip')
    destFile.write(zipBytes)

    return { saved: true as const, uri: destFile.uri }
  } catch (e) {
    devLog('Export failed', { error: serializeError(e) })
    if (tempDir.exists) tempDir.delete()
    if (zipCacheFile.exists) zipCacheFile.delete()
    throw e
  }
}

const pickDirectory = async () => {
  try {
    return await Directory.pickDirectoryAsync()
  } catch {
    return undefined
  }
}

const formatFilenameTimestamp = (date: Date) => date
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .slice(0, 19)
