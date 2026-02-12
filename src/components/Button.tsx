import { Pressable, Text } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

type Props = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

const Button = ({ title, onPress, variant = 'primary', disabled }: Props) => (
  <Pressable
    style={[
      styles.button,
      variant === 'secondary' && styles.buttonSecondary,
      disabled && styles.buttonDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[
      styles.text,
      variant === 'secondary' && styles.textSecondary,
      disabled && styles.textDisabled,
    ]}>
      {title}
    </Text>
  </Pressable>
)

const styles = StyleSheet.create(theme => ({
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.disabled,
    borderColor: theme.colors.disabled,
  },
  text: {
    color: theme.colors.accentText,
    ...theme.typography.body,
    fontWeight: '600',
  },
  textSecondary: {
    color: theme.colors.accent,
  },
  textDisabled: {
    color: theme.colors.disabledText,
  },
}))

export default Button
