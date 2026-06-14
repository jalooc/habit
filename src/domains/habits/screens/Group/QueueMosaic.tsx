import { Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Image } from 'expo-image'
import { imageFileUri } from 'src/domains/habits/utils/habitImages'

const MAX_TILES = 3

type Props = {
  images: string[],
  onOpen: (index: number) => unknown,
}

const QueueMosaic = ({ images, onOpen }: Props) => {
  const shown = images.slice(0, MAX_TILES)
  const extra = images.length - shown.length

  return (
    <View style={styles.strip}>
      {shown.map((filename, index) => (
        <Pressable
          key={filename}
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          onPress={() => void onOpen(index)}
        >
          <Image source={{ uri: imageFileUri(filename) }} style={styles.image} contentFit="cover" />
          {extra > 0 && index === shown.length - 1 && (
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>+{extra}</Text>
            </View>
          )}
        </Pressable>
      ))}
      {shown.length < MAX_TILES && <View style={{ flex: MAX_TILES - shown.length }} />}
    </View>
  )
}

export default QueueMosaic

const styles = StyleSheet.create(theme => ({
  strip: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  tile: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tilePressed: {
    opacity: 0.6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20,16,12,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    ...theme.typography.caption,
    color: '#ffffff',
  },
}))
