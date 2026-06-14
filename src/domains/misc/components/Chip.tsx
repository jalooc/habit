import { Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

type Props = {
  label: string,
  variant: 'outlined' | 'coralSoft',
  dot?: boolean,
  onPress?: () => unknown,
}

const Chip = ({ label, variant, dot, onPress }: Props) => {
  const content = (
    <>
      {dot && <View style={[styles.dot, styles.dotCoral]} />}
      <Text style={[styles.label, variant === 'coralSoft' ? styles.labelCoral : styles.labelOutlined]}>
        {label}
      </Text>
    </>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.chip,
          variant === 'coralSoft' ? styles.chipCoralSoft : styles.chipOutlined,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    )
  }

  return (
    <View style={[styles.chip, variant === 'coralSoft' ? styles.chipCoralSoft : styles.chipOutlined]}>
      {content}
    </View>
  )
}

export default Chip

const styles = StyleSheet.create(theme => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radii.pill,
    alignSelf: 'flex-start',
  },
  chipOutlined: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  chipCoralSoft: {
    backgroundColor: theme.colors.accentSubtle,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotCoral: {
    backgroundColor: theme.colors.accent,
  },
  label: {
    ...theme.typography.caption,
  },
  labelOutlined: {
    color: theme.colors.textTertiary,
  },
  labelCoral: {
    color: theme.colors.accent,
  },
  pressed: {
    opacity: 0.6,
  },
}))
