import { Pressable, ScrollView } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Image } from 'expo-image'
import { imageFileUri } from 'src/domains/habits/utils/habitImages'

type Props = {
  images: string[],
  onPress: (index: number) => unknown,
}

const ImageThumbnailRow = ({ images, onPress }: Props) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.row}
    style={styles.container}
  >
    {images.map((filename, index) => (
      <Pressable key={filename} onPress={() => void onPress(index)}>
        <Image
          source={{ uri: imageFileUri(filename) }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      </Pressable>
    ))}
  </ScrollView>
)

export default ImageThumbnailRow

const styles = StyleSheet.create(theme => ({
  container: {
    marginTop: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.sm,
  },
}))
