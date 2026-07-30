import { Directory, File, Paths } from 'expo-file-system'
import * as DocumentPicker from 'expo-document-picker'
import { unzip } from 'react-native-zip-archive'
import { z } from 'zod'
import { randomUUID } from 'expo-crypto'
import habits$, { parsePersistedHabits } from 'src/domains/habits/stores/habits'
import groups$, { parsePersistedGroups } from 'src/domains/habits/stores/groups'
import dayBoundaries$, { dayBoundariesSchema } from 'src/domains/misc/stores/dayBoundaries'
import { batch } from '@legendapp/state'
import { cleanupOrphanedImages, imagesDir } from 'src/domains/habits/utils/habitImages'
import { devLog } from 'src/domains/devTools/utils/devLog'
import { toNativePath } from './backupUtils'

export const importData = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'application/zip', 'application/x-zip-compressed'],
    copyToCacheDirectory: true,
    multiple: false,
  })

  if (result.canceled) return { imported: false as const }

  const asset = result.assets[0]
  if (asset.name.endsWith('.zip')) {
    return importZip(asset.uri)
  }
  return importJson(asset.uri)
}

const importJson = async (uri: string) => {
  parseAndApplyImport(await new File(uri).text())
  cleanupOrphanedImages()
  return { imported: true as const }
}

const importZip = async (uri: string) => {
  const tempDir = new Directory(Paths.cache, `import-${randomUUID()}`)
  tempDir.create()

  try {
    await unzip(toNativePath(uri), toNativePath(tempDir.uri))

    const srcImagesDir = new Directory(tempDir, 'images')
    if (srcImagesDir.exists) {
      if (imagesDir.exists) {
        devLog('Overwriting existing images directory.')
        imagesDir.delete()
      }
      await srcImagesDir.move(imagesDir)
    }

    parseAndApplyImport(await new File(tempDir, 'data.json').text())
    cleanupOrphanedImages()

    return { imported: true as const }
  } finally {
    if (tempDir.exists) tempDir.delete()
  }
}

const parseAndApplyImport = (serializedData: string) => {
  const {
    habits,
    groups,
    dayBoundaries: parsedDayBoundaries,
  } = z.object({
    version: z.union([z.literal(1), z.literal(2)]),
    exportedAt: z.iso.datetime(),
    habits: z.unknown(),
    groups: z.unknown(),
    dayBoundaries: dayBoundariesSchema,
  }).parse(JSON.parse(serializedData))

  const parsedHabits = parsePersistedHabits(habits)
  const parsedGroups = parsePersistedGroups(groups)

  batch(() => {
    habits$.delete()
    groups$.delete()
    dayBoundaries$.delete()

    habits$.set(parsedHabits)
    groups$.set(parsedGroups)
    dayBoundaries$.set(parsedDayBoundaries)
  })
}
