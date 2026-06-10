import { View, Text, Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

type Props = {
  value: number,
  min: number,
  max: number,
  label: string,
  onChange: (value: number) => void,
}

const NumberStepper = ({ value, min, max, label, onChange }: Props) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.stepper}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => void onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Text style={[styles.buttonText, value <= min && styles.buttonTextDisabled]}>-</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => void onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Text style={[styles.buttonText, value >= max && styles.buttonTextDisabled]}>+</Text>
      </Pressable>
    </View>
  </View>
)

export default NumberStepper

const styles = StyleSheet.create(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: theme.colors.accentSubtle,
    borderColor: theme.colors.accent,
  },
  buttonText: {
    fontSize: 18,
    color: theme.colors.text,
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
  value: {
    ...theme.typography.heading,
    color: theme.colors.text,
    minWidth: 32,
    textAlign: 'center',
  },
}))
