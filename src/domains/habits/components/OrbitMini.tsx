import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { withAlpha } from 'src/domains/misc/utils/theme'

type Props = {
  count: number,
  size?: number,
  litIndex?: number | null,
  halo?: boolean,
}

const OrbitMini = ({ count, size = 30, litIndex = 0, halo = false }: Props) => {
  const litDotSize = bySize(size, 6, 8)
  const nonLitDotSize = bySize(size, 3.5, 4)
  const ringInset = bySize(size, 11, 14)
  const radius = (size - ringInset) / 2
  const center = size / 2
  const haloSize = litDotSize * 1.85
  const dotBox = Math.max(12, halo ? haloSize : litDotSize)

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          { width: radius * 2, height: radius * 2, borderRadius: radius, top: center - radius, left: center - radius },
        ]}
      />
      {Array.from({ length: count }, (_, i) => {
        const angle = ((i / count) * 360 - 90) * (Math.PI / 180)
        const x = center + radius * Math.cos(angle)
        const y = center + radius * Math.sin(angle)
        const isLit = i === litIndex
        const dotSize = isLit ? litDotSize : nonLitDotSize

        return (
          <View
            key={i}
            style={[styles.dotBox, { width: dotBox, height: dotBox, top: y - dotBox / 2, left: x - dotBox / 2 }]}
          >
            {isLit && halo && (
              <View style={[styles.halo, { width: haloSize, height: haloSize, borderRadius: haloSize / 2 }]} />
            )}
            <View
              style={[
                isLit ? styles.litDot : styles.dot,
                { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
              ]}
            />
          </View>
        )
      })}
    </View>
  )
}

export default OrbitMini

// Hand-tuned at the two sizes it actually renders — the 30px row badge and the 72px
// rotations-index badge. Dot/ring metrics don't scale linearly between them, so interpolate.
const bySize = (size: number, at30: number, at72: number) =>
  at30 + ((at72 - at30) * (size - 30)) / (72 - 30)

const styles = StyleSheet.create(theme => ({
  container: {
    position: 'relative',
    flexShrink: 0,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: theme.colors.accentDim,
  },
  dotBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    backgroundColor: withAlpha(theme.colors.accent, 0.16),
  },
  dot: {
    backgroundColor: theme.colors.accentDim,
  },
  litDot: {
    backgroundColor: theme.colors.accent,
  },
}))
