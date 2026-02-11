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

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#A9A9A9',
    borderColor: '#A9A9A9',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  textSecondary: {
    color: '#007AFF',
  },
  textDisabled: {
    color: '#FFFFFF',
  },
})

export default Button
