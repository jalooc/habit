import { Directory, File, Paths } from 'expo-file-system'
import * as DocumentPicker from 'expo-document-picker'
import { unzip } from 'react-native-zip-archive'
import { RRuleTemporal } from 'rrule-temporal'
import { z } from 'zod'
import { randomUUID } from 'expo-crypto'
import habits$, { habitsSchema } from 'src/domains/habits/stores/habits'
import groups$, { persistedGroupsSchema } from 'src/domains/habits/stores/groups'
import dayBoundaries$, { dayBoundariesSchema } from '../../../misc/stores/dayBoundaries'
import { batch } from '@legendapp/state'
import { cleanupOrphanedImages, imagesDir } from 'src/domains/habits/utils/habitImages'
import { devLog } from 'src/domains/devTools/utils/devLog'
import { toNativePath } from './backupUtils'

const dataSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  exportedAt: z.iso.datetime(),
  habits: habitsSchema,
  groups: persistedGroupsSchema,
  dayBoundaries: dayBoundariesSchema,
})

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
  const text = await new File(uri).text()
  const parsed = dataSchema.parse(JSON.parse(text))
  applyImport(parsed)
  cleanupOrphanedImages()
  return { imported: true as const }
}

const importZip = async (uri: string) => {
  const tempDir = new Directory(Paths.cache, `import-${randomUUID()}`)
  tempDir.create()

  try {
    await unzip(toNativePath(uri), toNativePath(tempDir.uri))

    const text = await new File(tempDir, 'data.json').text()
    const parsed = dataSchema.parse(JSON.parse(text))

    const srcImagesDir = new Directory(tempDir, 'images')
    if (srcImagesDir.exists) {
      if (imagesDir.exists) {
        devLog('Overwriting existing images directory.')
        imagesDir.delete()
      }
      await srcImagesDir.move(imagesDir)
    }

    applyImport(parsed)
    cleanupOrphanedImages()

    return { imported: true as const }
  } finally {
    if (tempDir.exists) tempDir.delete()
  }
}

const applyImport = (parsed: z.infer<typeof dataSchema>) => {
  batch(() => {
    habits$.set(parsed.habits)
    groups$.set(deserializeGroups(parsed.groups))
    dayBoundaries$.set(parsed.dayBoundaries)
  })
}

type PersistedGroups = z.infer<typeof persistedGroupsSchema>

const deserializeGroups = (groups: PersistedGroups) => Object.fromEntries(
  Object.entries(groups).map(([id, group]) => [id, {
    ...group,
    recurrence: group.recurrence ?
      new RRuleTemporal({ rruleString: group.recurrence }) :
      undefined,
  }]),
)
