import { Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useNavigation } from '@react-navigation/native'
import SwipeToLog from 'src/domains/habits/components/SwipeToLog'
import { actionHabit } from 'src/domains/habits/utils/habitActions'
import { withAlpha } from 'src/domains/misc/utils/theme'

type DotKind = 'carried' | 'now' | 'upcoming'

type StatusDotProps = {
  kind: DotKind,
}

const StatusDot = ({ kind }: StatusDotProps) => (
  <View style={[styles.dot, dotStyles[kind]]} />
)

type Props = {
  groupName: string,
  habitName: string,
  tag: string,
  dotKind: DotKind,
  habitId: string,
  groupId: string,
  isFirst: boolean,
  surface: 'carried' | 'upNext',
}

const TodayRow = ({ groupName, habitName, tag, dotKind, habitId, groupId, isFirst, surface }: Props) => {
  const navigation = useNavigation()

  return (
    <SwipeToLog label="Logged" onTrigger={() => void actionHabit(habitId, 'completed')}>
      <Pressable
        onPress={() => void navigation.navigate('Habit', { habitId, groupId })}
        style={[
          styles.row,
          surface === 'carried' ? styles.rowCarried : styles.rowUpNext,
          !isFirst && (surface === 'carried' ? styles.rowBorderCarried : styles.rowBorderUpNext),
        ]}
      >
        {({ pressed }) => (
          <View style={[styles.rowContent, pressed && styles.contentPressed]}>
            <StatusDot kind={dotKind} />
            <View style={styles.content}>
              <Text style={styles.kicker}>{groupName}</Text>
              <Text style={styles.name} numberOfLines={1}>{habitName}</Text>
            </View>
            <Text style={[styles.tag, dotKind === 'upcoming' ? styles.tagUpcoming : styles.tagDue]}>
              {tag}
            </Text>
          </View>
        )}
      </Pressable>
    </SwipeToLog>
  )
}

export default TodayRow

const styles = StyleSheet.create(theme => ({
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rowCarried: {
    backgroundColor: theme.colors.accentSubtle,
  },
  rowUpNext: {
    backgroundColor: theme.colors.surface,
  },
  rowBorderCarried: {
    borderTopWidth: 1,
    borderTopColor: withAlpha(theme.colors.accent, 0.18),
  },
  rowBorderUpNext: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  contentPressed: {
    opacity: 0.6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 100,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    ...theme.typography.label,
    fontSize: 10,
    color: theme.colors.accent,
  },
  name: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  tag: {
    ...theme.typography.label,
    fontSize: 10,
  },
  tagDue: {
    color: theme.colors.accent,
  },
  tagUpcoming: {
    color: theme.colors.textTertiary,
  },
}))

const dotStyles = StyleSheet.create(theme => ({
  carried: {
    backgroundColor: theme.colors.accent,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
  },
  now: {
    backgroundColor: theme.colors.accent,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    boxShadow: `0 0 0 4px ${withAlpha(theme.colors.accent, 0.18)}`,
  },
  upcoming: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.accentDim,
  },
}))
