import { useEffect, type ComponentProps } from 'react'
import { AppState, Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import {
  PermissionStatus,
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
} from 'expo-image-picker'
import { getDocumentAsync } from 'expo-document-picker'
import * as Clipboard from 'expo-clipboard'
import { File, Paths } from 'expo-file-system'
import { randomUUID } from 'expo-crypto'
import { useObservable, useValue } from '@legendapp/state/react'
import Lucide from '@react-native-vector-icons/lucide'

type Props = {
  onAdd: (uri: string) => Promise<void>,
  onDone: () => unknown,
}

const ImageSourceChips = ({ onAdd, onDone }: Props) => {
  const clipboardHasImage = useClipboardHasImage()

  const handleLibrary = async () => {
    const result = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    })

    onDone()
    if (result.canceled) return

    await Promise.all(result.assets.map(a => onAdd(a.uri)))
  }

  const handleCamera = async () => {
    const { status } = await requestCameraPermissionsAsync()
    if (status !== PermissionStatus.GRANTED) {
      onDone()
      return
    }

    const result = await launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })

    onDone()
    if (result.canceled) return

    await Promise.all(result.assets.map(a => onAdd(a.uri)))
  }

  const handleFiles = async () => {
    const result = await getDocumentAsync({ type: 'image/*', multiple: true })

    onDone()
    if (result.canceled) return

    await Promise.all(result.assets.map(a => onAdd(a.uri)))
  }

  const handlePaste = async () => {
    const result = await Clipboard.getImageAsync({ format: 'jpeg' })
    if (!result?.data) return

    const tempFile = new File(Paths.cache, `${randomUUID()}.jpg`)
    tempFile.write(result.data, { encoding: 'base64' })

    await onAdd(tempFile.uri)
    tempFile.delete()

    onDone()
  }

  return (
    <View style={styles.chips}>
      <SourceChip icon="image" label="Library" onPress={handleLibrary} />
      <SourceChip icon="camera" label="Camera" onPress={handleCamera} />
      <SourceChip icon="folder" label="Files" onPress={handleFiles} />
      <SourceChip icon="clipboard" label="Paste" onPress={handlePaste} disabled={!clipboardHasImage} />
    </View>
  )
}

export default ImageSourceChips

const useClipboardHasImage = () => {
  const has$ = useObservable(false)
  const check = () => void Clipboard.hasImageAsync().then(has => void has$.set(has))

  useEffect(() => void check(), [])

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') check()
    })
    return () => void sub.remove()
  }, [])

  return useValue(has$)
}

type SourceChipProps = {
  icon: ComponentProps<typeof Lucide>['name'],
  label: string,
  onPress: () => unknown,
  disabled?: boolean,
}

const SourceChip = ({ icon, label, onPress, disabled }: SourceChipProps) => (
  <Pressable
    style={({ pressed }) => [styles.chip, disabled && styles.chipDisabled, pressed && styles.chipPressed]}
    onPress={onPress}
    disabled={disabled}
  >
    <Lucide name={icon} size={13} style={styles.chipIcon} />
    <Text style={styles.chipText}>{label}</Text>
  </Pressable>
)

const styles = StyleSheet.create(theme => ({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipPressed: {
    opacity: 0.6,
  },
  chipIcon: {
    color: theme.colors.textSecondary,
  },
  chipText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
}))
