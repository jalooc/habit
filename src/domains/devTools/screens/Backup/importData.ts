import { Directory, File, Paths } from 'expo-file-system'
import * as DocumentPicker from 'expo-document-picker'
import { unzip } from 'react-native-zip-archive'
import { z } from 'zod'
import { randomUUID } from 'expo-crypto'
import { atom, getDefaultStore } from 'jotai'
import habitsAtom, { type HabitsStore, parsePersistedHabits } from 'src/domains/habits/stores/habits'
import groupsAtom, { type GroupsStore, parsePersistedGroups } from 'src/domains/habits/stores/groups'
import dayBoundariesAtom, { dayBoundariesSchema } from 'src/domains/misc/stores/dayBoundaries'
import lastActionAtom from 'src/domains/habits/stores/lastAction'
import { cleanupOrphanedImages, imagesDir } from 'src/domains/habits/utils/habitImages'
import { devLog } from 'src/domains/devTools/utils/devLog'
import { toNativePath } from './backupUtils'

const backupSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  exportedAt: z.iso.datetime(),
  habits: z.unknown(),
  groups: z.unknown(),
  dayBoundaries: dayBoundariesSchema,
})

type ParsedBackup = {
  habits: HabitsStore,
  groups: GroupsStore,
  dayBoundaries: z.infer<typeof dayBoundariesSchema>,
}

// One write, so that nothing derived from the stores ever sees the imported habits next to the
// previous rotations. A pending undo would write its target back into the imported data, so it
// goes in the same write. It goes last because clearing last action on a deleted habit removes the
// habit's images, unless the backup has just brought that habit back.
const applyBackupAtom = atom(null, (_get, set, backup: ParsedBackup) => {
  set(habitsAtom, backup.habits)
  set(groupsAtom, backup.groups)
  set(dayBoundariesAtom, backup.dayBoundaries)
  set(lastActionAtom, undefined)
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
  applyBackup(parseBackup(await new File(uri).text()))
  cleanupOrphanedImages()
  return { imported: true as const }
}

const importZip = async (uri: string) => {
  const tempDir = new Directory(Paths.cache, `import-${randomUUID()}`)
  tempDir.create()

  try {
    await unzip(toNativePath(uri), toNativePath(tempDir.uri))

    // parsed before the images are swapped, so a backup that gets refused leaves the current ones alone
    const backup = parseBackup(await new File(tempDir, 'data.json').text())

    const srcImagesDir = new Directory(tempDir, 'images')
    if (srcImagesDir.exists) {
      if (imagesDir.exists) {
        devLog('Overwriting existing images directory.')
        imagesDir.delete()
      }
      await srcImagesDir.move(imagesDir)
    }

    applyBackup(backup)
    cleanupOrphanedImages()

    return { imported: true as const }
  } finally {
    if (tempDir.exists) tempDir.delete()
  }
}

const parseBackup = (serializedData: string) => {
  const { habits, groups, dayBoundaries } = backupSchema.parse(JSON.parse(serializedData))

  return {
    habits: parsePersistedHabits(habits, rejectUnreadable('Habit')),
    groups: parsePersistedGroups(groups, rejectUnreadable('Rotation')),
    dayBoundaries,
  }
}

// Unlike a launch, an import can refuse: rejecting the backup leaves the current data as it is.
const rejectUnreadable = (entity: string) => (id: string, error: unknown) => {
  throw new Error(`${entity} ${id} in the backup could not be read`, { cause: error })
}

const applyBackup = (backup: ParsedBackup) => void getDefaultStore().set(applyBackupAtom, backup)
