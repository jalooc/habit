import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

type Props = {
  count: number,
  size?: number,
}

const OrbitMini = ({ count, size = 64 }: Props) => {
  const radius = (size - 14) / 2
  const cx = size / 2
  const cy = size / 2

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          {
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            top: cy - radius,
            left: cx - radius,
          },
        ]}
      />
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 360 - 90
        const rad = (angle * Math.PI) / 180
        const x = cx + radius * Math.cos(rad)
        const y = cy + radius * Math.sin(rad)
        const isActive = i === 0
        const dotSize = isActive ? 8 : 4

        return (
          <View
            key={i}
            style={[
              styles.dot,
              isActive ? styles.dotActive : styles.dotInactive,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                top: y - dotSize / 2,
                left: x - dotSize / 2,
              },
            ]}
          />
        )
      })}
    </View>
  )
}

export default OrbitMini

const styles = StyleSheet.create(theme => ({
  container: {
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: theme.colors.accentDim,
  },
  dot: {
    position: 'absolute',
  },
  dotActive: {
    backgroundColor: theme.colors.accent,
  },
  dotInactive: {
    backgroundColor: theme.colors.accentDim,
  },
}))
