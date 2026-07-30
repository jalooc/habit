import { useCallback } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useValue } from '@legendapp/state/react'
import { StyleSheet } from 'react-native-unistyles'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import dayjs from 'dayjs'
import Lucide from '@react-native-vector-icons/lucide'
import Box from 'src/domains/misc/components/Box'
import Chip from 'src/domains/misc/components/Chip'
import UndoToast from 'src/domains/habits/components/UndoToast'
import RotationsList from 'src/domains/habits/components/RotationsList'
import AddRotationCard from 'src/domains/habits/components/AddRotationCard'
import RotationsLink from './RotationsLink'
import TodaySections from './TodaySections'
import OtherRotationsHeader from './OtherRotationsHeader'
import DevToolsLink from 'src/domains/devTools/components/DevToolsLink'
import dayBoundaries$ from 'src/domains/misc/stores/dayBoundaries'
import groups$ from 'src/domains/habits/stores/groups'
import habits$ from 'src/domains/habits/stores/habits'
import buildHomeSections from './buildHomeSections'
import { computed } from '@legendapp/state'

const NOW_REFRESH_MS = 60_000

const now$ = computed(() => dayjs())
const homeSections$ = computed(() => buildHomeSections({
  groups: groups$.get(),
  habits: habits$.get(),
  dayBoundaries: dayBoundaries$.get(),
  now: now$.get(),
}))

const Home = () => {
  const navigation = useNavigation()
  const { top } = useSafeAreaInsets()

  const groups = useValue(groups$)
  const dayBoundaries = useValue(dayBoundaries$)

  // `now` drives the carried/up-next buckets; refresh on focus and on a slow tick
  // so a "now" row ages into "carried" and upcoming turns surface without a store change.
  useFocusEffect(useCallback(() => {
    now$.set(dayjs())
    const interval = setInterval(() => void now$.set(dayjs()), NOW_REFRESH_MS)
    return () => void clearInterval(interval)
  }, []))

  const sections = useValue(homeSections$)

  const hasNoGroups = Object.keys(groups).length === 0
  const hasSurfaced = sections.carried.length > 0 || sections.upNext.length > 0
  const activeHoursLabel =
    `Active hours · ${formatTime(dayBoundaries.start.hour, dayBoundaries.start.minute)}` +
    ` – ${formatTime(dayBoundaries.end.hour, dayBoundaries.end.minute)}`

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
      <RotationsList
        groupIds={sections.otherGroupIds}
        isAppEmpty={hasNoGroups}
        header={
          <View style={homeStyles.listHeader}>
            <TodaySections sections={sections} />
            {hasSurfaced && sections.otherGroupIds.length > 0 && (
              <OtherRotationsHeader />
            )}
          </View>
        }
        footer={
          <>
            {!hasNoGroups && (
              <RotationsLink
                count={Object.keys(groups).length}
                onPress={() => void navigation.navigate('Groups')}
              />
            )}
            <AddRotationCard
              onPress={() => void navigation.navigate('NewGroup')}
              isEmpty={hasNoGroups}
            />
          </>
        }
      />
      <UndoToast />
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
  listHeader: {
    gap: theme.spacing.lg,
  },
}))

const formatTime = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`
