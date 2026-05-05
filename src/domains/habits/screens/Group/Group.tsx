import { StaticScreenProps, useNavigation } from '@react-navigation/native'
import { Text, TextInput, View, Pressable } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { useObservable, useSelector, useValue } from '@legendapp/state/react'
import groups$ from 'src/domains/habits/stores/groups'
import habits$ from 'src/domains/habits/stores/habits'
import Box from '../../../misc/components/Box'
import { StyleSheet } from 'react-native-unistyles'
import Button from '../../../misc/components/Button'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useRef } from 'react'
import { $TextInput } from '@legendapp/state/react-native'
import { randomUUID } from 'expo-crypto'
import { pastelOf } from '../../../misc/utils/theme'
import RecurrenceSummary from './RecurrenceSummary'
import { GROUP_ID_PARAM } from 'src/domains/habits/utils/linking'
import HabitCard from './HabitCard'

type Props = StaticScreenProps<{
  [GROUP_ID_PARAM]: string,
  withTickOff?: boolean,
}>

const Group = ({ route }: Props) => {
  const groupId = route.params.id
  const withTickOff = route.params.withTickOff
  const navigation = useNavigation()
  const { name, habits } = useValue(groups$[groupId])
  const habitIds = useSelector(() => {
    const habitsMap = habits$.get()
    return Object.keys(habits).sort((a, b) =>
      (habitsMap[a].lastActioned?.timestamp ?? 0) - (habitsMap[b].lastActioned?.timestamp ?? 0)
    )
  })

  return (
    <Box>
      <Text style={groupStyles.title}>{name}</Text>
      <RecurrenceSummary groupId={groupId} />
      <Animated.FlatList
        keyboardShouldPersistTaps="handled"
        data={habitIds}
        keyExtractor={id => id}
        renderItem={({ item: id, index }) => {
          const { bg, border } = pastelOf(id)
          return (
            <HabitCard
              id={id}
              style={{ backgroundColor: bg, borderColor: border }}
              showTickOffControls={withTickOff && index === 0}
              onAction={() => void navigation.setParams({ withTickOff: false })}
            />
          )
        }}
        contentContainerStyle={groupStyles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
        ListFooterComponent={
          <AddHabitFooter groupId={groupId} hasHabits={habitIds.length > 0} />
        }
        itemLayoutAnimation={listTransition}
      />
    </Box>
  )
}

export default Group

const groupStyles = StyleSheet.create(theme => ({
  title: {
    ...theme.typography.title,
    color: theme.colors.text,
    paddingBottom: theme.spacing.xl,
  },
  list: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
}))

const EmptyState = () => (
  <View style={emptyStyles.container}>
    <Text style={emptyStyles.text}>No habits yet</Text>
  </View>
)

const emptyStyles = StyleSheet.create(theme => ({
  container: {
    paddingVertical: theme.spacing['3xl'],
    alignItems: 'center',
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.textTertiary,
  },
}))

const AddHabitFooter = ({ groupId, hasHabits }: { groupId: string, hasHabits: boolean }) => {
  const newHabitName$ = useObservable('')
  const inputRef = useRef<TextInput>(null)
  const sheetRef = useRef<TrueSheet>(null)

  const addHabit = () => {
    void sheetRef.current?.dismiss()
    const newHabitName = newHabitName$.get()
    setTimeout(() => {
      const newHabitId = randomUUID()
      habits$[newHabitId].set({ name: newHabitName })
      groups$[groupId].habits[newHabitId].set(true)
    }, 500)
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [addCardStyles.container, pressed && addCardStyles.pressed]}
        onPress={() => sheetRef.current?.present()}
      >
        <Text style={addCardStyles.plus}>+</Text>
        <Text style={addCardStyles.label}>
          {hasHabits ? 'Add Habit' : 'Add First Habit'}
        </Text>
      </Pressable>
      <TrueSheet
        ref={sheetRef}
        detents={['auto']}
        onDidPresent={() => inputRef.current?.focus()}
        onDidDismiss={() => void newHabitName$.set('')}
      >
        <View style={sheetStyles.sheet}>
          <Text style={sheetStyles.sheetTitle}>New Habit</Text>
          <$TextInput
            style={sheetStyles.input}
            $value={newHabitName$}
            // @ts-expect-error ref type in Legend State components doesn't match
            ref={inputRef}
            placeholder="Habit name"
            placeholderTextColor="#A8A29E"
            onKeyPress={e => {
              if (e.nativeEvent.key === 'Enter') {
                addHabit()
              }
            }}
          />
          <Button title="Create" onPress={addHabit} />
        </View>
      </TrueSheet>
    </>
  )
}

const addCardStyles = StyleSheet.create(theme => ({
  container: {
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  pressed: {
    backgroundColor: theme.colors.accentSubtle,
    borderColor: theme.colors.accent,
  },
  plus: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  label: {
    ...theme.typography.body,
    fontWeight: '500',
    color: theme.colors.accent,
  },
}))

const sheetStyles = StyleSheet.create(theme => ({
  sheet: {
    padding: theme.spacing['3xl'],
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.xl,
  },
  sheetTitle: {
    ...theme.typography.heading,
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
  },
}))

const listTransition = LinearTransition
  .springify()
  .damping(12)
  .stiffness(90)
  .mass(0.8)
