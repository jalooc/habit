import { Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Image } from 'expo-image'
import { useEffect, useRef } from 'react'
import Lucide from '@react-native-vector-icons/lucide'
import { imageFileUri } from 'src/domains/habits/utils/habitImages'

type Props = {
  images: string[],
  initialIndex: number,
  visible: boolean,
  onClose: () => unknown,
}

const ImageViewer = ({ images, initialIndex, visible, onClose }: Props) => {
  const { width, height } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (visible) {
      scrollRef.current?.scrollTo({ x: initialIndex * width, animated: false })
    }
  }, [visible, initialIndex, width])

  return (
    <Modal
      visible={visible}
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.container}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
        >
          {images.map(filename => (
            <Pressable
              key={filename}
              style={[styles.page, { width, height }]}
              onPress={onClose}
            >
              <Image
                source={{ uri: imageFileUri(filename) }}
                style={{ width, height }}
                contentFit="contain"
              />
            </Pressable>
          ))}
        </ScrollView>
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={16}>
          <Lucide name="x" size={22} style={styles.closeIcon} />
        </Pressable>
      </View>
    </Modal>
  )
}

export default ImageViewer

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    flex: 1,
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: theme.spacing.xl,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#fff',
  },
}))
