import { Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Lucide from '@react-native-vector-icons/lucide'

type Props = {
  count: number,
  onPress: () => unknown,
}

const RotationsLink = ({ count, onPress }: Props) => (
  <Pressable
    style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    onPress={onPress}
  >
    <View style={styles.left}>
      <Lucide name="circle" size={18} style={styles.circle} />
      <View>
        <Text style={styles.label}>All rotations</Text>
        <Text style={styles.count}>{count} {count === 1 ? 'rotation' : 'rotations'}</Text>
      </View>
    </View>
    <Lucide name="arrow-right" size={18} style={styles.arrow} />
  </Pressable>
)

export default RotationsLink

const styles = StyleSheet.create(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: 18,
    marginTop: theme.spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minWidth: 0,
  },
  circle: {
    color: theme.colors.accent,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  count: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  arrow: {
    color: theme.colors.textTertiary,
  },
}))
