import { Text, View, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useValue } from '@legendapp/state/react'
import { StyleSheet } from 'react-native-unistyles'
import { useNavigation } from '@react-navigation/native'
import Box from '../../components/Box'
import Groups from './Groups'
import DayBoundaries from './DayBoundaries'
import DevToolsLink from '../../../devTools/components/DevToolsLink'
import dayBoundaries$ from 'src/domains/misc/stores/dayBoundaries'

const Home = () => {
  const navigation = useNavigation()
  const { top } = useSafeAreaInsets()

  return (
    <Box style={{ paddingTop: top + 16 }}>
      <View style={homeStyles.header}>
        <View style={homeStyles.headerText}>
          <Text style={homeStyles.greeting}>Your Habits</Text>
          <Text style={homeStyles.subtitle}>Stay consistent, stay strong</Text>
        </View>
        <DevToolsLink />
      </View>
      <DayBoundaries
        start={useValue(dayBoundaries$.start)}
        end={useValue(dayBoundaries$.end)}
        onStartChange={v => void dayBoundaries$.start.set(v)}
        onEndChange={v => void dayBoundaries$.end.set(v)}
      />
      <Groups
        footer={
          <AddGroupCard onPress={() => void navigation.navigate('NewGroup')} />
        }
      />
    </Box>
  )
}

export default Home

const homeStyles = StyleSheet.create(theme => ({
  header: {
    paddingBottom: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    ...theme.typography.title,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
}))

const AddGroupCard = ({ onPress }: { onPress: () => void }) => (
  <Pressable
    style={({ pressed }) => [addCardStyles.container, pressed && addCardStyles.pressed]}
    onPress={onPress}
  >
    <Text style={addCardStyles.plus}>+</Text>
    <Text style={addCardStyles.label}>New Group</Text>
  </Pressable>
)

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
    color: theme.colors.accent,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.accent,
  },
}))
