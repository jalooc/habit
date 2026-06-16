import { Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import SectionLabel from '../SectionLabel'

type Props = {
  label: string,
  count: number,
  meta: string,
  tone: 'carried' | 'upNext',
}

const TodaySectionHeader = ({ label, count, meta, tone }: Props) => (
  <View style={styles.row}>
    <SectionLabel style={tone === 'carried' ? styles.labelCarried : styles.labelUpNext}>{label}</SectionLabel>
    <View style={tone === 'carried' ? styles.badgeCarried : styles.badgeUpNext}>
      <Text style={tone === 'carried' ? styles.badgeTextCarried : styles.badgeTextUpNext}>
        {count}
      </Text>
    </View>
    <View style={styles.spacer} />
    <Text style={styles.meta}>{meta}</Text>
  </View>
)

export default TodaySectionHeader

const styles = StyleSheet.create(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingHorizontal: 6,
    paddingBottom: 10,
  },
  labelCarried: {
    color: theme.colors.accent,
  },
  labelUpNext: {
    color: theme.colors.textSecondary,
  },
  badgeCarried: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeUpNext: {
    backgroundColor: theme.colors.accentSubtle,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeTextCarried: {
    ...theme.typography.caption,
    color: theme.colors.background,
  },
  badgeTextUpNext: {
    ...theme.typography.caption,
    color: theme.colors.accent,
  },
  spacer: {
    flex: 1,
  },
  meta: {
    fontFamily: theme.fonts.serifItalic,
    fontSize: 11,
    lineHeight: 14,
    color: theme.colors.textTertiary,
  },
}))
