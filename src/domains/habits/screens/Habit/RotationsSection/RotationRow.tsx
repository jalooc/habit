import { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import OrbitMini from 'src/domains/habits/components/OrbitMini'

type Props = {
  name: string,
  cadenceLabel: string | null,
  meta: string,
  emphasizeMeta?: boolean,
  count: number,
  litIndex?: number | null,
  onPress?: () => void,
  trailing?: ReactNode,
  divider?: 'solid' | 'dashed',
}

const RotationRow = ({
  name,
  cadenceLabel,
  meta,
  emphasizeMeta,
  count,
  litIndex,
  onPress,
  trailing,
  divider,
}: Props) => {
  const renderContent = (pressed: boolean) => (
    <View
      style={[
        styles.row,
        divider === 'solid' && styles.dividerSolid,
        divider === 'dashed' && styles.dividerDashed,
        pressed && styles.pressed,
      ]}
    >
      <OrbitMini count={count} litIndex={litIndex} halo />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {cadenceLabel ? `${cadenceLabel} · ` : ''}
          <Text style={emphasizeMeta ? styles.metaEmphasis : undefined}>{meta}</Text>
        </Text>
      </View>
      {trailing}
    </View>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        {({ pressed }) => renderContent(pressed)}
      </Pressable>
    )
  }

  return renderContent(false)
}

export default RotationRow

const styles = StyleSheet.create(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: 2,
  },
  dividerSolid: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  dividerDashed: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: theme.colors.accentDim,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: theme.fonts.serifItalic,
    fontSize: 17,
    lineHeight: 21,
    color: theme.colors.text,
  },
  meta: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  metaEmphasis: {
    fontFamily: theme.fonts.sansMedium,
    color: theme.colors.accent,
  },
}))
