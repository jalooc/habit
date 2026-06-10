import { Pressable, Text } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

type Props = {
  title: string,
  onPress: () => void,
  variant?: 'primary' | 'secondary',
  disabled?: boolean,
}

const Button = ({ title, onPress, variant = 'primary', disabled }: Props) => (
  <Pressable
    style={({ pressed }) => [
      styles.button,
      variant === 'secondary' && styles.buttonSecondary,
      disabled && styles.disabled,
      pressed && styles.pressed,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.text, variant === 'secondary' && styles.textSecondary]}>
      {title}
    </Text>
  </Pressable>
)

const styles = StyleSheet.create(theme => ({
  button: {
    backgroundColor: theme.colors.text,
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.accentDim,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    ...theme.typography.button,
    color: theme.colors.background,
  },
  textSecondary: {
    color: theme.colors.textSecondary,
  },
}))

export default Button
