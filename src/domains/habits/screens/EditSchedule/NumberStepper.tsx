import { View, Text, Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Lucide from '@react-native-vector-icons/lucide'
import { withAlpha } from 'src/domains/misc/utils/theme'

type Props = {
  value: number,
  min: number,
  max: number,
  label: string,
  onChange: (value: number) => unknown,
}

const NumberStepper = ({ value, min, max, label, onChange }: Props) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.stepper}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          value <= min && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => void onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Lucide name="minus" size={16} style={[styles.buttonIcon, value <= min && styles.buttonIconDisabled]} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          value >= max && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => void onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Lucide name="plus" size={16} style={[styles.buttonIcon, value >= max && styles.buttonIconDisabled]} />
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
    paddingVertical: theme.spacing.xs,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.background,
    opacity: 0.75,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  button: {
    width: 34,
    height: 34,
    borderRadius: theme.radii.pill,
    backgroundColor: withAlpha(theme.colors.background, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonIcon: {
    color: theme.colors.background,
  },
  buttonIconDisabled: {
    opacity: 0.5,
  },
  value: {
    fontFamily: theme.fonts.serifItalic,
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: theme.colors.background,
    minWidth: 32,
    textAlign: 'center',
  },
}))
