import { Pressable, Text } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Lucide from '@react-native-vector-icons/lucide'

type Props = {
  onPress: () => unknown,
  isEmpty: boolean,
}

const AddRotationCard = ({ onPress, isEmpty }: Props) => (
  <Pressable
    style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    onPress={onPress}
  >
    <Lucide name="plus" size={18} style={styles.plus} />
    <Text style={styles.label}>{isEmpty ? 'Make your first rotation' : 'New rotation'}</Text>
  </Pressable>
)

export default AddRotationCard

const styles = StyleSheet.create(theme => ({
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
