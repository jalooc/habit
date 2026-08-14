import { Pressable, Text, View } from 'react-native'
import Lucide from '@react-native-vector-icons/lucide'
import { StyleSheet } from 'react-native-unistyles'
import { Image } from 'expo-image'
import type { HabitSearchResult } from 'src/domains/habits/utils/searchHabits'
import { imageFileUri } from 'src/domains/habits/utils/habitImages'
import RoundToggle from 'src/domains/habits/components/RoundToggle'

import HighlightedName from './HighlightedName'

type Props = {
  habit: HabitSearchResult,
  isFirst: boolean,
  onLink: (habitId: string) => void,
}

const HabitSuggestionRow = ({ habit, isFirst, onLink }: Props) => {
  const { id, name, images, description, isInRotation, rotationInfo, matches } = habit
  const meta = isInRotation ? 'Already in this rotation' : rotationInfo

  const firstImage = images?.[0]
  const leading = firstImage ? (
    <View style={styles.thumbnail}>
      <Image
        source={{ uri: imageFileUri(firstImage) }}
        style={styles.thumbnailImage}
        contentFit="cover"
      />
    </View>
  ) : (
    <View style={styles.indicatorSlot}>
      <View style={styles.hollowDot} />
    </View>
  )

  const content = (
    <View
      style={[
        styles.row,
        !isFirst && styles.rowBorder,
        isInRotation && styles.rowDisabled,
      ]}
    >
      {leading}
      <View style={styles.text}>
        <HighlightedName name={name} matches={matches} />
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
          {!isInRotation && description && (
            <Text style={styles.noteHint}>{'  ¶'}</Text>
          )}
        </Text>
      </View>
      {isInRotation ? (
        <Lucide name="check" size={18} style={styles.checkIcon} />
      ) : (
        <View pointerEvents="none">
          <RoundToggle kind="add" onPress={() => void onLink(id)} />
        </View>
      )}
    </View>
  )

  if (isInRotation) return content

  return (
    <Pressable
      onPress={() => void onLink(id)}
    >
      {({ pressed }) => (
        <View style={pressed ? styles.pressed : undefined}>
          {content}
        </View>
      )}
    </Pressable>
  )
}

export default HabitSuggestionRow

const styles = StyleSheet.create(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: 2,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: theme.colors.accentDim,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.6,
  },
  indicatorSlot: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  hollowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.accentDim,
  },
  thumbnail: {
    width: 30,
    height: 30,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexShrink: 0,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  noteHint: {
    color: theme.colors.textTertiary,
  },
  checkIcon: {
    color: theme.colors.textSecondary,
  },
}))
