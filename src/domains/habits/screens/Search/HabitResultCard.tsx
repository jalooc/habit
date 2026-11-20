import { Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import QueuePlace from 'src/domains/habits/components/QueuePlace'
import { describeHabitCard, type HabitCard } from './habitCards'
import type searchHabits from './searchHabits'
import splitMatches from './splitMatches'

type Props = {
  card: HabitCard,
  nameMatches: ReturnType<typeof searchHabits>[number]['nameMatches'],
  onPress: () => unknown,
}

const HabitResultCard = ({ card, nameMatches, onPress }: Props) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={describeHabitCard(card)}
    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
  >
    <Text style={styles.name}>
      {splitMatches(card.name, nameMatches).map(run => (
        <Text key={run.start} style={run.isMatch && styles.match}>{run.text}</Text>
      ))}
    </Text>
    {card.rotations.map(rotation => (
      <View key={rotation.groupId} style={styles.rotation}>
        <Text style={styles.rotationName} numberOfLines={1}>{rotation.groupName}</Text>
        <Text style={styles.place} numberOfLines={1}>
          <QueuePlace index={rotation.index} count={rotation.count} upNextStyle={styles.upNext} />
        </Text>
      </View>
    ))}
  </Pressable>
)

export default HabitResultCard

const styles = StyleSheet.create(theme => ({
  card: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.6,
  },
  name: {
    ...theme.typography.body,
    fontSize: 17,
    lineHeight: 23,
    color: theme.colors.text,
  },
  match: {
    color: theme.colors.accentText,
  },
  rotation: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  // 15, not 13–14: at those sizes Android's italic face drops trailing "9:09"-like runs
  rotationName: {
    flexShrink: 1,
    fontFamily: theme.fonts.serifItalic,
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  place: {
    ...theme.typography.caption,
    flexShrink: 0,
    color: theme.colors.textSecondary,
  },
  upNext: {
    fontFamily: theme.fonts.sansMedium,
    color: theme.colors.accentText,
  },
}))
