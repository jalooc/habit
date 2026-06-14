import { Pressable, ScrollView, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Image } from 'expo-image'
import { useObservable, useValue } from '@legendapp/state/react'
import Lucide from '@react-native-vector-icons/lucide'
import ImageSourceChips from './ImageSourceChips'

type Props = {
  pendingImages: {
    uri: string,
    remove: () => unknown,
  }[],
  onAddImage: (uri: string) => Promise<void>,
}

const PendingImageRow = ({ pendingImages, onAddImage }: Props) => {
  const sourcesVisible$ = useObservable(false)
  const sourcesVisible = useValue(sourcesVisible$)

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {pendingImages.map(({ uri, remove }) => (
          <View key={uri} style={styles.thumbWrapper}>
            <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
            <Pressable onPress={remove} style={styles.removeButton} hitSlop={8}>
              <Lucide name="x" size={11} style={styles.removeIcon} />
            </Pressable>
          </View>
        ))}
        <Pressable
          style={({ pressed }) => [styles.addTile, pressed && styles.addTilePressed]}
          onPress={() => void sourcesVisible$.toggle()}
        >
          <Lucide name={sourcesVisible ? 'x' : 'plus'} size={20} style={styles.addTileIcon} />
        </Pressable>
      </ScrollView>

      {sourcesVisible && (
        <ImageSourceChips
          onAdd={onAddImage}
          onDone={() => void sourcesVisible$.set(false)}
        />
      )}
    </View>
  )
}

export default PendingImageRow

const styles = StyleSheet.create(theme => ({
  container: {
    gap: theme.spacing.sm,
  },
  strip: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingRight: theme.spacing.xs,
  },
  thumbWrapper: {
    position: 'relative',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
  },
  removeIcon: {
    color: theme.colors.background,
  },
  addTile: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTilePressed: {
    opacity: 0.6,
  },
  addTileIcon: {
    color: theme.colors.accent,
  },
}))
