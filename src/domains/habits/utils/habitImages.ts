import { Directory, File, Paths } from 'expo-file-system'
import habits$ from 'src/domains/habits/stores/habits'

export const imagesDir = new Directory(Paths.document, 'habit-images')

const isFile = (item: File | Directory): item is File => 'extension' in item

export const imageFileUri = (filename: string): string =>
  new File(imagesDir, filename).uri

export const cleanupOrphanedImages = (): void => {
  if (!imagesDir.exists) return
  const activeFilenames = new Set(
    Object.values(habits$.peek()).flatMap(h => h.images ?? []),
  )
  for (const item of imagesDir.list()) {
    if (isFile(item) && !activeFilenames.has(item.name)) item.delete()
  }
}
