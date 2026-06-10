import { StyleSheet } from 'react-native-unistyles'
import { Pressable, Text, View } from 'react-native'

type Props = {
  onTickOff: () => void,
  onSkipRound: () => void,
}

const ActionsRow = ({ onTickOff, onSkipRound }: Props) => (
  <View style={actionStyles.container}>
    <View style={actionStyles.divider} />
    <View style={actionStyles.row}>
      <Pressable
        onPress={onTickOff}
        style={({ pressed }) => [actionStyles.tickOff, pressed && actionStyles.tickOffPressed]}
      >
        <View style={actionStyles.tickOffMarkRing}>
          <Text style={actionStyles.tickOffMark}>✓</Text>
        </View>
        <Text style={actionStyles.tickOffLabel}>Tick off</Text>
      </Pressable>
      <Pressable
        onPress={onSkipRound}
        style={({ pressed }) => [actionStyles.skip, pressed && actionStyles.pressedSubtle]}
      >
        <Text style={actionStyles.skipLabel}>Skip round</Text>
      </Pressable>
    </View>
  </View>
)

export default ActionsRow

const actionStyles = StyleSheet.create(theme => ({
  container: {
    marginTop: theme.spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.text,
    opacity: 0.08,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: theme.spacing.sm,
  },
  tickOff: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.text,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.pill,
    ...theme.shadows.card,
  },
  tickOffPressed: {
    opacity: 0.6,
  },
  tickOffMarkRing: {
    width: 22,
    height: 22,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOffMark: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 14,
  },
  tickOffLabel: {
    ...theme.typography.button,
    color: theme.colors.background,
  },
  skip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.accentDim,
  },
  skipLabel: {
    ...theme.typography.button,
    color: theme.colors.textSecondary,
  },
  pressedSubtle: {
    opacity: 0.6,
  },
}))
