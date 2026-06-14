import { Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Image } from 'expo-image'
import { imageFileUri } from 'src/domains/habits/utils/habitImages'

const MAX_THUMBS = 4
const THUMB_SIZE = 38

type Props = {
  images: string[],
  onOpen: (index: number) => unknown,
}

const HeroImageStrip = ({ images, onOpen }: Props) => {
  const shown = images.slice(0, MAX_THUMBS)
  const extra = images.length - shown.length

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {shown.map((filename, index) => (
          <Pressable
            key={filename}
            style={({ pressed }) => [styles.thumb, pressed && styles.thumbPressed]}
            onPress={() => void onOpen(index)}
          >
            <Image source={{ uri: imageFileUri(filename) }} style={styles.image} contentFit="cover" />
          </Pressable>
        ))}
        {extra > 0 && (
          <Pressable
            style={({ pressed }) => [styles.thumb, styles.countTile, pressed && styles.thumbPressed]}
            onPress={() => void onOpen(MAX_THUMBS)}
          >
            <Text style={styles.countText}>+{extra}</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.caption}>
        {images.length === 1 ? '1 image' : `${images.length} images`} · tap to view
      </Text>
    </View>
  )
}

export default HeroImageStrip

const styles = StyleSheet.create(theme => ({
  container: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  thumbPressed: {
    opacity: 0.6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  countTile: {
    backgroundColor: theme.colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...theme.typography.caption,
    fontSize: 12,
    color: theme.colors.accent,
  },
  caption: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: theme.colors.textTertiary,
  },
}))
