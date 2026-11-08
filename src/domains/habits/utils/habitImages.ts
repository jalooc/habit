import { Directory, File, Paths } from 'expo-file-system'
import { getDefaultStore } from 'jotai'
import habitsAtom, { getUnreadableHabitsCopies } from 'src/domains/habits/stores/habits'

export const imagesDir = new Directory(Paths.document, 'habit-images')

const isFile = (item: File | Directory): item is File => 'extension' in item

export const imageFileUri = (filename: string): string =>
  new File(imagesDir, filename).uri

export const deleteImageFiles = (filenames: string[]): void => {
  filenames.forEach(filename => {
    const file = new File(imagesDir, filename)
    if (file.exists) file.delete()
  })
}

export const cleanupOrphanedImages = (): void => {
  if (!imagesDir.exists) return
  const habits = getDefaultStore().get(habitsAtom)
  // an empty table is also what an unreadable one loads as, and then the files are all that is left
  if (Object.keys(habits).length === 0) return
  const activeFilenames = new Set(Object.values(habits).flatMap(h => h.images ?? []))
  // A habit left out on load still owns its images. Its set-aside bytes are searched as text, since
  // they need not even be JSON.
  const unreadableHabits = getUnreadableHabitsCopies()
  const isOwned = (filename: string) =>
    activeFilenames.has(filename) || unreadableHabits.some(copy => copy.includes(filename))

  for (const item of imagesDir.list()) {
    if (isFile(item) && !isOwned(item.name)) item.delete()
  }
}
