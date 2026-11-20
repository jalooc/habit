import { useEffect, useState } from 'react'
import { ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { StaticScreenProps, useNavigation } from '@react-navigation/native'
import { StyleSheet } from 'react-native-unistyles'
import { useAtomValue } from 'jotai'
import habitsAtom, { type HabitsStore } from 'src/domains/habits/stores/habits'
import Button from 'src/domains/misc/components/Button'
import Description from 'src/domains/habits/components/Description'
import HabitEditor from 'src/domains/habits/components/HabitEditor'
import useImageViewer from 'src/domains/habits/utils/useImageViewer'
import ImageThumbnailRow from './ImageThumbnailRow'
import RotationsSection from './RotationsSection'

type Props = StaticScreenProps<{
  habitId: string,
  withRotationsInitiallyExpanded?: boolean,
  rotationRowPressReplacesScreenBelow?: boolean,
  rotationRowPressNudgesHabit?: boolean,
}>

const Habit = ({ route }: Props) => {
  const {
    habitId,
    withRotationsInitiallyExpanded,
    rotationRowPressReplacesScreenBelow,
    rotationRowPressNudgesHabit,
  } = route.params
  const navigation = useNavigation()
  const habits: Partial<HabitsStore> = useAtomValue(habitsAtom)
  const habit = habits[habitId]
  const { height } = useWindowDimensions()
  const [mode, setMode] = useState<'read' | 'edit'>('read')
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
        habitId={habitId}
        onDone={() => void setMode('read')}
        onCancel={() => void setMode('read')}
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
      style={{ maxHeight: height * 0.85 }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>Habit</Text>
        <Button title="Edit" variant="secondary" onPress={() => void setMode('edit')} />
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
      <RotationsSection
        habitId={habitId}
        initiallyExpanded={withRotationsInitiallyExpanded}
        rowPressReplacesScreenBelow={rotationRowPressReplacesScreenBelow}
        rowPressNudgesHabit={rotationRowPressNudgesHabit}
      />
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
