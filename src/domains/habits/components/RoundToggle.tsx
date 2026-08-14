import { Pressable } from 'react-native'
import Lucide from '@react-native-vector-icons/lucide'
import { StyleSheet } from 'react-native-unistyles'

type Props = {
  kind: 'add' | 'remove',
  disabled?: boolean,
  onPress: () => void,
}

const RoundToggle = ({ kind, disabled, onPress }: Props) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    hitSlop={8}
    style={({ pressed }) => [
      styles.toggle,
      kind === 'add' ? styles.add : styles.remove,
      disabled && styles.disabled,
      pressed && styles.pressed,
    ]}
  >
    <Lucide
      name={kind === 'add' ? 'plus' : 'minus'}
      size={16}
      style={kind === 'add' ? styles.addIcon : styles.removeIcon}
    />
  </Pressable>
)

export default RoundToggle

const styles = StyleSheet.create(theme => ({
  toggle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  add: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.accentDim,
    backgroundColor: 'transparent',
  },
  remove: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.6,
  },
  addIcon: {
    color: theme.colors.accent,
  },
  removeIcon: {
    color: theme.colors.textSecondary,
  },
}))
