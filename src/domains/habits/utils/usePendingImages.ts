import { useObservable, useSelector } from '@legendapp/state/react'
import { randomUUID } from 'expo-crypto'
import { Directory, File, Paths } from 'expo-file-system'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { imagesDir } from 'src/domains/habits/utils/habitImages'
import { isTruthy } from 'remeda'

const MAX_IMAGE_SIZE = 1200

const pendingImagesDir = new Directory(Paths.cache, 'pending-images')

export default () => {
  const pendingImagesUris$ = useObservable<string[]>([])
  const pendingImages = useSelector(() => pendingImagesUris$.get().map(uri => ({
    uri,
    remove: () => {
      const file = new File(uri)
      if (file.exists) file.delete()

      const idx = pendingImagesUris$.get().indexOf(uri)
      if (idx !== -1) pendingImagesUris$.splice(idx, 1)
    },
  })))

  const addImage = async (uri: string) => {
    const pendingUri = await savePendingImageFromUri(uri)
    pendingImagesUris$.push(pendingUri)
  }

  const commitImages = async () => {
    const uris = pendingImagesUris$.get()
    if (uris.length === 0) return Promise.resolve([])

    imagesDir.create({ idempotent: true })

    const filenames = await Promise.all(uris.map(async uri => {
      const file = new File(uri)
      if (!file.exists) return undefined
      await file.move(new File(imagesDir, file.name))
      return file.name
    }))

    return filenames.filter(isTruthy)
  }

  const clearImages = () => {
    cleanupPendingImages()
    pendingImagesUris$.set([])
  }

  return {
    pendingImages,
    addPendingImage: addImage,
    commitPendingImages: commitImages,
    clearPendingImages: clearImages,
  }
}

export const cleanupPendingImages = (): void => {
  if (pendingImagesDir.exists) pendingImagesDir.delete()
}

const compress = async (sourceUri: string): Promise<string> => {
  const preview = await ImageManipulator.manipulate(sourceUri).renderAsync()
  const ref = preview.width > MAX_IMAGE_SIZE ?
    await ImageManipulator.manipulate(sourceUri).resize({ width: MAX_IMAGE_SIZE }).renderAsync() :
    preview
  const saved = await ref.saveAsync({ compress: 0.7, format: SaveFormat.JPEG })
  return saved.uri
}

const savePendingImageFromUri = async (sourceUri: string): Promise<string> => {
  void pendingImagesDir.create({ idempotent: true })
  const compressedUri = await compress(sourceUri)
  const filename = `${randomUUID()}.jpg`
  const compressedFile = new File(compressedUri)
  await compressedFile.move(new File(pendingImagesDir, filename))
  return compressedFile.uri
}
