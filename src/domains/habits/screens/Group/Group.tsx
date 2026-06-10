import { StaticScreenProps, useNavigation } from '@react-navigation/native'
import { Pressable, Text, View } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { useSelector, useValue } from '@legendapp/state/react'
import groups$ from 'src/domains/habits/stores/groups'
import habits$ from 'src/domains/habits/stores/habits'
import Box from '../../../misc/components/Box'
import { StyleSheet } from 'react-native-unistyles'
import RecurrenceSummary from './RecurrenceSummary'
import { GROUP_ID_PARAM } from 'src/domains/habits/utils/linking'
import HabitCard from './HabitCard'
import AddHabitFooter from './AddHabitFooter'

type Props = StaticScreenProps<{
  [GROUP_ID_PARAM]: string,
  withTickOff?: boolean,
}>

const Group = ({ route }: Props) => {
  const groupId = route.params.id
  const withTickOff = route.params.withTickOff
  const navigation = useNavigation()
  const { name } = useValue(groups$[groupId])
  const habitIds = useSelector(() => {
    const habitsMap = habits$.get()
    return Object.keys(groups$[groupId].habits.get()).sort((a, b) =>
      (habitsMap[a].lastActioned?.timestamp ?? 0) - (habitsMap[b].lastActioned?.timestamp ?? 0)
    )
  })

  return (
    <Box>
      <Pressable onPress={() => void navigation.navigate('EditGroup', { groupId })}>
        <Text style={groupStyles.title}>{name}</Text>
      </Pressable>
      <RecurrenceSummary groupId={groupId} />
      <Animated.FlatList
        keyboardShouldPersistTaps="handled"
        data={habitIds}
        keyExtractor={id => id}
        renderItem={({ item: id, index }) => (
          <HabitCard
            id={id}
            groupId={groupId}
            showTickOffControls={withTickOff && index === 0}
            onAction={() => void navigation.setParams({ withTickOff: false })}
          />
        )}
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
    fontFamily: theme.fonts.serifItalic,
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

const listTransition = LinearTransition
  .springify()
  .damping(12)
  .stiffness(90)
  .mass(0.8)
