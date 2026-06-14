import { Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Description from 'src/domains/habits/components/Description'

const CLAMP_HEIGHT = 120

type Props = {
  description: string,
  onOpen: () => unknown,
}

const HabitNoteCard = ({ description, onOpen }: Props) => (
  <Pressable
    style={({ pressed }) => [styles.shadow, pressed && styles.pressed]}
    onPress={onOpen}
  >
    <View style={styles.inner}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>Note</Text>
        <Text style={styles.open}>Open ↗</Text>
      </View>
      <View style={styles.clamp} pointerEvents="none">
        <Description description={description} />
      </View>
    </View>
  </Pressable>
)

export default HabitNoteCard

const styles = StyleSheet.create(theme => ({
  shadow: {
    borderRadius: theme.radii.md,
    ...theme.shadows.card,
  },
  pressed: {
    opacity: 0.6,
  },
  inner: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
  },
  open: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11,
    lineHeight: 13,
    color: theme.colors.accent,
  },
  clamp: {
    maxHeight: CLAMP_HEIGHT,
    overflow: 'hidden',
  },
}))
