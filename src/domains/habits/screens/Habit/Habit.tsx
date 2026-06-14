import { useEffect } from 'react'
import { ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { StaticScreenProps, useNavigation } from '@react-navigation/native'
import { StyleSheet } from 'react-native-unistyles'
import { useObservable, useSelector, useValue } from '@legendapp/state/react'
import habits$, { HabitsStores } from 'src/domains/habits/stores/habits'
import Button from 'src/domains/misc/components/Button'
import Description from 'src/domains/habits/components/Description'
import HabitEditor from 'src/domains/habits/components/HabitEditor'
import useImageViewer from 'src/domains/habits/utils/useImageViewer'
import ImageThumbnailRow from './ImageThumbnailRow'

type Props = StaticScreenProps<{
  habitId: string,
  groupId: string,
}>

const Habit = ({ route }: Props) => {
  const { habitId, groupId } = route.params
  const navigation = useNavigation()
  const habit = useSelector(() => {
    const habits: Partial<HabitsStores> = habits$.get()
    const found = habits[habitId]
    // Spread: Legend State mutates the stored object in place on set, so the selector would
    // otherwise return the same reference, and edits made in the editor mode would not re-render.
    return found ? { ...found } : undefined
  })
  const { height } = useWindowDimensions()
  const mode$ = useObservable<'read' | 'edit'>('read')
  const mode = useValue(mode$)
  const { setVisibleImageIndex, renderImageViewer } = useImageViewer()

  useEffect(() => {
    if (!habit) navigation.goBack()
  }, [habit, navigation])

  if (!habit) {
    console.error(`Habit ${habitId} not found.`)
    return null
  }

  if (mode === 'edit') {
    return (
      <HabitEditor
        groupId={groupId}
        habitId={habitId}
        onDone={() => void mode$.set('read')}
        onCancel={() => void mode$.set('read')}
        onRemoved={() => void navigation.goBack()}
      />
    )
  }

  const images = habit.images ?? []
  const hasImages = images.length > 0

  return (
    /*
      When altering this structure, make sure that the following works on both platforms (Android & iOS):
      - scrolling when content overflows the container
      - swipe down to close the sheet when content overflows the container
      - swipe down to close the sheet when content doesn't overflow the container (i.e. the content is not scrollable)
     */
    <ScrollView
      style={{ maxHeight: height * 0.6 }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>Habit</Text>
        <Button title="Edit" variant="secondary" onPress={() => void mode$.set('edit')} />
      </View>
      <Text style={styles.name}>{habit.name}</Text>
      {hasImages && (
        <>
          <ImageThumbnailRow
            images={images}
            onPress={index => void setVisibleImageIndex(index)}
          />
          {renderImageViewer(images)}
        </>
      )}
      {habit.description ? (
        <Description description={habit.description} />
      ) : (
        <Text style={styles.emptyNote}>No note yet.</Text>
      )}
    </ScrollView>
  )
}

export default Habit

const styles = StyleSheet.create(theme => ({
  content: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingBottom: theme.spacing['2xl'],
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  kicker: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
  },
  name: {
    fontFamily: theme.fonts.serif,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.3,
    color: theme.colors.text,
  },
  emptyNote: {
    fontFamily: theme.fonts.serifItalic,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textTertiary,
  },
}))
