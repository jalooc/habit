import { Text } from 'react-native'
import type { FuseResult } from 'fuse.js'
import { StyleSheet } from 'react-native-unistyles'
import type { SearchableHabit } from 'src/domains/habits/utils/searchHabits'

type Props = {
  name: string,
  matches: FuseResult<SearchableHabit>['matches'],
}

const HighlightedName = ({ name, matches }: Props) => {
  const nameMatch = matches?.find(m => m.key === 'name')
  if (!nameMatch?.indices.length) {
    return <Text style={styles.name}>{name}</Text>
  }

  const segments: { text: string, highlight: boolean }[] = []
  let cursor = 0

  nameMatch.indices.forEach(([start, end]) => {
    if (cursor < start) segments.push({ text: name.slice(cursor, start), highlight: false })
    segments.push({ text: name.slice(start, end + 1), highlight: true })
    cursor = end + 1
  })

  if (cursor < name.length) segments.push({ text: name.slice(cursor), highlight: false })

  return (
    <Text style={styles.name} numberOfLines={1}>
      {segments.map((segment, index) => (
        <Text
          key={index}
          style={segment.highlight ? styles.nameHighlight : undefined}
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  )
}

export default HighlightedName

const styles = StyleSheet.create(theme => ({
  name: {
    fontFamily: theme.fonts.serifItalic,
    fontSize: 17,
    lineHeight: 21,
    color: theme.colors.text,
  },
  nameHighlight: {
    color: theme.colors.accent,
  },
}))
