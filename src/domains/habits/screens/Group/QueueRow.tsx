import { Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useNavigation } from '@react-navigation/native'
import { actionHabit } from 'src/domains/habits/utils/habitActions'
import useImageViewer from 'src/domains/habits/utils/useImageViewer'
import SwipeToLog from './SwipeToLog'
import QueueMosaic from './QueueMosaic'

type Props = {
  id: string,
  name: string,
  images: string[],
  hasNote: boolean,
  isFirst: boolean,
  groupId: string,
}

const QueueRow = ({ id, name, images, hasNote, isFirst, groupId }: Props) => {
  const navigation = useNavigation()

  const { setVisibleImageIndex, renderImageViewer } = useImageViewer()

  return (
    <>
      <SwipeToLog label="Logged" onTrigger={() => void actionHabit(id, 'completed')}>
        <Pressable
          onPress={() => void navigation.navigate('Habit', { habitId: id, groupId })}
          style={({ pressed }) => [styles.row, !isFirst && styles.rowBorder, pressed && styles.rowPressed]}
        >
          <View style={styles.indicatorSlot}>
            <View style={styles.hollowDot} />
          </View>
          <View style={styles.content}>
            <Text style={styles.habitName} numberOfLines={2}>
              {name}
              {hasNote && <Text style={styles.noteHint}>{'  ¶'}</Text>}
            </Text>
            {images.length > 0 && (
              <QueueMosaic
                images={images}
                onOpen={index => void setVisibleImageIndex(index)}
              />
            )}
          </View>
        </Pressable>
      </SwipeToLog>
      {images.length > 0 && renderImageViewer(images)}
    </>
  )
}

export default QueueRow

const styles = StyleSheet.create(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  rowPressed: {
    opacity: 0.6,
  },
  indicatorSlot: {
    width: 26,
    height: 22,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hollowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.accentDim,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  habitName: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  noteHint: {
    ...theme.typography.body,
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
}))
