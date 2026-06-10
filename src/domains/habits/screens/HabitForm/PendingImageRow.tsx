import { AppState, Pressable, ScrollView, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Image } from 'expo-image'
import * as Clipboard from 'expo-clipboard'
import { File, Paths } from 'expo-file-system'
import { launchImageLibraryAsync } from 'expo-image-picker'
import { randomUUID } from 'expo-crypto'
import { useObservable, useValue } from '@legendapp/state/react'
import { useEffect } from 'react'

type Props = {
  pendingImages: {
    uri: string,
    remove: () => unknown,
  }[],
  onAddImage: (uri: string) => Promise<void>,
}

const PendingImageRow = ({ pendingImages, onAddImage }: Props) => {
  const clipboardHasImage = useClipboardHasImage()

  const handlePaste = async () => {
    const result = await Clipboard.getImageAsync({ format: 'jpeg' })
    if (!result?.data) return
    const tempFile = new File(Paths.cache, `${randomUUID()}.jpg`)
    tempFile.write(result.data, { encoding: 'base64' })
    await onAddImage(tempFile.uri)
    tempFile.delete()
  }

  const handleGallery = async () => {
    const result = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    })
    if (result.canceled) return

    await Promise.all(result.assets.map(({ uri }) => onAddImage(uri)))
  }

  return (
    <View style={styles.container}>
      {pendingImages.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailsRow}
          style={styles.thumbnailsScroll}
        >
          {pendingImages.map(({ uri, remove }) => (
            <View key={uri} style={styles.thumbnailWrapper}>
              <Image
                source={{ uri }}
                style={styles.thumbnail}
                contentFit="cover"
              />
              <Pressable
                onPress={remove}
                style={styles.removeButton}
                hitSlop={8}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={styles.actions}>
        <Pressable
          onPress={handlePaste}
          style={({ pressed }) => [
            styles.actionButton,
            !clipboardHasImage && styles.actionButtonDimmed,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Text style={styles.actionButtonText}>📋 Paste</Text>
        </Pressable>
        <Pressable
          onPress={handleGallery}
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
        >
          <Text style={styles.actionButtonText}>🖼 Gallery</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default PendingImageRow

const styles = StyleSheet.create(theme => ({
  container: {
    gap: theme.spacing.sm,
  },
  thumbnailsScroll: {
    overflow: 'visible',
  },
  thumbnailsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingTop: 8,
    paddingRight: 8,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: theme.radii.sm,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: theme.colors.background,
    fontSize: 14,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  actionButtonDimmed: {
    opacity: 0.4,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
}))

const useClipboardHasImage = () => {
  const clipboardHasImage$ = useObservable(false)

  const check = () => void Clipboard.hasImageAsync().then(has => void clipboardHasImage$.set(has))

  useEffect(() => void check(), [])

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') check()
    })

    return () => void sub.remove()
  }, [])

  return useValue(clipboardHasImage$)
}
