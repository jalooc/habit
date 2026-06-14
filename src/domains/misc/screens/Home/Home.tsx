import { Text, View, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from '@legendapp/state/react'
import { StyleSheet } from 'react-native-unistyles'
import { useNavigation } from '@react-navigation/native'
import dayjs from 'dayjs'
import Lucide from '@react-native-vector-icons/lucide'
import Box from 'src/domains/misc/components/Box'
import Chip from 'src/domains/misc/components/Chip'
import Groups from './Groups'
import DevToolsLink from 'src/domains/devTools/components/DevToolsLink'
import dayBoundaries$ from 'src/domains/misc/stores/dayBoundaries'
import groups$ from 'src/domains/habits/stores/groups'

const Home = () => {
  const navigation = useNavigation()
  const { top } = useSafeAreaInsets()

  const activeHoursLabel = useSelector(() => {
    const s = dayBoundaries$.start.get()
    const e = dayBoundaries$.end.get()
    return `Active hours · ${formatTime(s.hour, s.minute)} – ${formatTime(e.hour, e.minute)}`
  })

  const isEmpty = useSelector(() => Object.keys(groups$.get()).length === 0)

  return (
    <Box style={{ paddingTop: top + 16 }}>
      <View style={homeStyles.strip}>
        <View style={homeStyles.wordmarkRow}>
          <Lucide name="circle" size={11} style={homeStyles.wordmarkCircle} />
          <Text style={homeStyles.wordmark}>ORBIT</Text>
        </View>
        <View style={homeStyles.stripRight}>
          <Text style={homeStyles.date}>{dayjs().format('ddd · MMM D')}</Text>
          <DevToolsLink />
        </View>
      </View>
      <Text style={homeStyles.title}>Rotations</Text>
      <View style={homeStyles.chipRow}>
        <Chip
          label={activeHoursLabel}
          variant="outlined"
          dot
          onPress={() => void navigation.navigate('ActiveHours')}
        />
      </View>
      <Groups
        footer={
          <AddRotationCard
            onPress={() => void navigation.navigate('NewGroup')}
            isEmpty={isEmpty}
          />
        }
      />
    </Box>
  )
}

export default Home

const homeStyles = StyleSheet.create(theme => ({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordmarkCircle: {
    color: theme.colors.accent,
  },
  wordmark: {
    ...theme.typography.label,
    color: theme.colors.accent,
    letterSpacing: 1.4,
  },
  stripRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  chipRow: {
    marginBottom: theme.spacing.lg,
  },
}))

type AddRotationCardProps = {
  onPress: () => unknown,
  isEmpty: boolean,
}

const AddRotationCard = ({ onPress, isEmpty }: AddRotationCardProps) => (
  <Pressable
    style={({ pressed }) => [addCardStyles.container, pressed && addCardStyles.pressed]}
    onPress={onPress}
  >
    <Lucide name="plus" size={18} style={addCardStyles.plus} />
    <Text style={addCardStyles.label}>{isEmpty ? 'Make your first rotation' : 'New rotation'}</Text>
  </Pressable>
)

const formatTime = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`

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
    opacity: 0.6,
  },
  plus: {
    color: theme.colors.accent,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.accent,
  },
}))
