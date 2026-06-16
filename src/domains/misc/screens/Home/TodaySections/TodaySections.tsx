import { View } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { StyleSheet } from 'react-native-unistyles'
import type { HomeSections } from '../buildHomeSections'
import formatElapsedAgo from './formatElapsedAgo'
import formatSlotTime from './formatSlotTime'
import TodaySectionHeader from './TodaySectionHeader'
import TodayRow from './TodayRow'

type Props = {
  sections: HomeSections,
}

const TodaySections = ({ sections }: Props) => (
  <View style={styles.container}>
    {sections.carried.length > 0 && (
      <View>
        <TodaySectionHeader
          label="Carried over"
          count={sections.carried.length}
          meta={`oldest ${formatElapsedAgo(sections.carried[0].dueSinceMs)} ago`}
          tone="carried"
        />
        <View style={styles.carriedCard}>
          {sections.carried.map((row, index) => (
            <Animated.View key={row.habitId} layout={listTransition}>
              <TodayRow
                groupName={row.groupName}
                habitName={row.habitName}
                tag={formatElapsedAgo(row.dueSinceMs)}
                dotKind="carried"
                habitId={row.habitId}
                groupId={row.groupId}
                isFirst={index === 0}
                surface="carried"
              />
            </Animated.View>
          ))}
        </View>
      </View>
    )}
    {sections.upNext.length > 0 && (
      <View>
        <TodaySectionHeader
          label="Up next"
          count={sections.upNext.length}
          meta="today"
          tone="upNext"
        />
        <View style={styles.upNextCard}>
          {sections.upNext.map((row, index) => (
            <Animated.View key={row.habitId} layout={listTransition}>
              <TodayRow
                groupName={row.groupName}
                habitName={row.habitName}
                tag={row.kind === 'now' ? 'NOW' : formatSlotTime(new Date(row.slotMs))}
                dotKind={row.kind === 'now' ? 'now' : 'upcoming'}
                habitId={row.habitId}
                groupId={row.groupId}
                isFirst={index === 0}
                surface="upNext"
              />
            </Animated.View>
          ))}
        </View>
      </View>
    )}
  </View>
)

export default TodaySections

const styles = StyleSheet.create(theme => ({
  container: {
    gap: theme.spacing.lg,
  },
  carriedCard: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.accentSubtle,
    overflow: 'hidden',
  },
  upNextCard: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
}))

const listTransition = LinearTransition
  .springify()
  .damping(12)
  .stiffness(90)
  .mass(0.8)
