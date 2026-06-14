import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { StaticScreenProps, useNavigation } from '@react-navigation/native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { useSelector, useValue } from '@legendapp/state/react'
import { StyleSheet } from 'react-native-unistyles'
import groups$ from 'src/domains/habits/stores/groups'
import habits$ from 'src/domains/habits/stores/habits'
import { GROUP_ID_PARAM } from 'src/domains/habits/utils/linking'
import UndoToast from 'src/domains/habits/components/UndoToast'
import { actionHabit } from 'src/domains/habits/utils/habitActions'
import orderQueue from 'src/domains/habits/utils/orderQueue'
import isGroupDue from 'src/domains/habits/utils/groupDueness'
import formatCadence from 'src/domains/habits/utils/formatCadence'
import formatNextTurn from 'src/domains/habits/utils/formatNextTurn'
import Chip from 'src/domains/misc/components/Chip'
import Button from 'src/domains/misc/components/Button'
import useImageViewer from 'src/domains/habits/utils/useImageViewer'
import OrbitRing from './OrbitRing'
import SlideToConfirm from './SlideToConfirm'
import AddHabitFooter from './AddHabitFooter'
import QueueRow from './QueueRow'
import HeroImageStrip from './HeroImageStrip'
import HabitNoteCard from './HabitNoteCard'

const SCREEN_PADDING = 22
const CARD_PADDING = 16

type Props = StaticScreenProps<{
  [GROUP_ID_PARAM]: string,
}>

const Group = ({ route }: Props) => {
  const groupId = route.params.id
  const navigation = useNavigation()
  const { width } = useWindowDimensions()

  const { name, recurrence } = useValue(groups$[groupId])

  const orderedHabitIds = useSelector(() => {
    const habitsMap = habits$.get()
    const groupHabitIds = Object.keys(groups$[groupId].habits.get())
    return orderQueue(groupHabitIds, habitsMap)
  })

  const orderedHabits = useSelector(() => {
    const habitsMap = habits$.get()
    return orderedHabitIds.map(id => {
      const { name: habitName, description, images } = habitsMap[id]
      return { id, name: habitName, description, images: images ?? [] }
    })
  })

  const isDue = useSelector(() => {
    const habitsMap = habits$.get()
    const [upNextId] = orderedHabitIds
    const upNextLastActioned = upNextId ? habitsMap[upNextId].lastActioned?.timestamp : undefined
    return isGroupDue({ recurrence, upNextLastActioned, now: new Date() })
  })

  const ringSize = Math.max(220, Math.min(276, width - 2 * SCREEN_PADDING - 2 * CARD_PADDING))
  const hasHabits = orderedHabits.length > 0
  const upNext = orderedHabits.at(0)
  const queueHabits = orderedHabits.slice(1)

  const { setVisibleImageIndex, renderImageViewer } = useImageViewer()

  const cadenceLabel = recurrence ? formatCadence(recurrence) : null
  const habitCount = orderedHabits.length
  const habitCountLabel = habitCount === 1 ? '1 habit in rotation' : `${habitCount} habits in rotation`

  const nextTurnLabel = !isDue && hasHabits && recurrence ? formatNextTurn(recurrence) : undefined

  const handleMarkDone = () => {
    if (upNext) actionHabit(upNext.id, 'completed')
  }
  const handleSkip = () => {
    if (upNext) actionHabit(upNext.id, 'skipped')
  }

  return (
    <View style={styles.screenRoot}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onLongPress={() => void navigation.navigate('EditGroup', { groupId })}
          delayLongPress={300}
          style={({ pressed }) => pressed && styles.titlePressed}
        >
          <Text style={styles.title}>{name}</Text>
        </Pressable>

        <View style={styles.chipRow}>
          <Chip label={habitCountLabel} variant="coralSoft" dot />
          <Chip
            label={cadenceLabel ?? 'Set a schedule'}
            variant="outlined"
            onPress={() => void navigation.navigate('EditSchedule', { groupId })}
          />
        </View>

        <View style={styles.heroCardShadow}>
          <View style={styles.heroCardInner}>
            {upNext ? (
              <>
                <OrbitRing
                  habits={orderedHabits}
                  size={ringSize}
                  kicker={isDue ? 'Your turn' : 'Up next'}
                  kickerAccent={isDue}
                  onPressName={() => void navigation.navigate('Habit', { habitId: upNext.id, groupId })}
                />
                {upNext.images.length > 0 && (
                  <HeroImageStrip
                    images={upNext.images}
                    onOpen={index => void setVisibleImageIndex(index)}
                  />
                )}
                <SlideToConfirm label="Slide to log" doneLabel="Logged" onConfirm={handleMarkDone} />
                <Button title="Skip this turn" variant="ghost" onPress={handleSkip} />
                {nextTurnLabel && (
                  <Text style={styles.nextTurn}>{`Next turn - ${nextTurnLabel}`}</Text>
                )}
              </>
            ) : (
              <Text style={styles.heroEmpty}>Nothing in this rotation yet.</Text>
            )}
          </View>
        </View>

        {upNext?.description && (
          <HabitNoteCard
            description={upNext.description}
            onOpen={() => void navigation.navigate('Habit', { habitId: upNext.id, groupId })}
          />
        )}

        {queueHabits.length > 0 && (
          <>
            <Text style={styles.queueKicker}>The queue</Text>
            <View style={styles.queueCardShadow}>
              <View style={styles.queueCardInner}>
                {queueHabits.map((habit, index) => (
                  <Animated.View key={habit.id} layout={listTransition}>
                    <QueueRow
                      id={habit.id}
                      name={habit.name}
                      images={habit.images}
                      hasNote={!!habit.description}
                      isFirst={index === 0}
                      groupId={groupId}
                    />
                  </Animated.View>
                ))}
              </View>
            </View>
          </>
        )}

        <AddHabitFooter groupId={groupId} hasHabits={hasHabits} />
      </ScrollView>

      {upNext && upNext.images.length > 0 && renderImageViewer(upNext.images)}

      <UndoToast />
    </View>
  )
}

export default Group

const styles = StyleSheet.create(theme => ({
  screenRoot: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: theme.spacing['3xl'],
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.title,
    fontFamily: theme.fonts.serifItalic,
    color: theme.colors.text,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
  },
  titlePressed: {
    opacity: 0.6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  heroCardShadow: {
    borderRadius: theme.radii.xl,
    ...theme.shadows.card,
  },
  heroCardInner: {
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: CARD_PADDING,
    paddingHorizontal: CARD_PADDING,
    gap: theme.spacing.lg,
  },
  // serif, not serifItalic — the italic face silently drops trailing time runs ("9:09") on Android
  nextTurn: {
    fontFamily: theme.fonts.serif,
    fontSize: 13,
    lineHeight: 17,
    color: theme.colors.textTertiary,
  },
  heroEmpty: {
    ...theme.typography.body,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
  queueKicker: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.sm,
  },
  queueCardShadow: {
    borderRadius: theme.radii.md,
    ...theme.shadows.card,
  },
  queueCardInner: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
}))

const listTransition = LinearTransition
  .springify()
  .damping(12)
  .stiffness(90)
  .mass(0.8)
