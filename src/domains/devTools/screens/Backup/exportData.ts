import { Directory, File, Paths } from 'expo-file-system'
import { zip } from 'react-native-zip-archive'
import { randomUUID } from 'expo-crypto'
import habits$ from 'src/domains/habits/stores/habits'
import groups$, { GroupsStore } from 'src/domains/habits/stores/groups'
import dayBoundaries$ from 'src/domains/misc/stores/dayBoundaries'
import { imagesDir } from 'src/domains/habits/utils/habitImages'
import { devLog } from 'src/domains/devTools/utils/devLog'
import { serializeError } from 'serialize-error'
import { toNativePath } from './backupUtils'

export const exportData = async () => {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    habits: habits$.get(),
    groups: serializeGroups(groups$.get()),
    dayBoundaries: dayBoundaries$.get(),
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

const serializeGroups = (groups: GroupsStore) => Object.fromEntries(
  Object.entries(groups).map(([id, group]) => [id, {
    ...group,
    recurrence: group.recurrence?.toString(),
  }]),
)

const formatFilenameTimestamp = (date: Date) => date
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .slice(0, 19)
