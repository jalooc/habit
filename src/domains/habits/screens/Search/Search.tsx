import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { AccessibilityInfo, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native'
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { atom, useAtom, useAtomValue } from 'jotai'
import { StyleSheet } from 'react-native-unistyles'
import habitsAtom from 'src/domains/habits/stores/habits'
import groupsAtom from 'src/domains/habits/stores/groups'
import recentlyOpenedAtom, {
  getRecentlyOpened,
  keepShownOrder,
  withHabitOpened,
} from 'src/domains/habits/stores/recentlyOpened'
import UndoToast from 'src/domains/habits/components/UndoToast'
import buildHabitCards, { isUpNextAnywhere } from './habitCards'
import searchHabits, { createHabitIndex } from './searchHabits'
import SearchField from './SearchField'
import HabitResultCard from './HabitResultCard'

// Recently opened habits are offered, not found: they sit back until the query matches them.
const DIMMED_OPACITY = 0.55
const opacityTransition = { transitionProperty: 'opacity', transitionDuration: 220 } as const
// cards past the cap enter with the last one, so a long list takes no longer than a short one
const STAGGER_MS = 50
const MAX_STAGGER_STEPS = 6
// Reanimated's default spring is critically damped, so opacity settles without overshooting
const fadeInAt = (index: number) => FadeIn.springify().delay(Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS)
// stiffer, still critically damped (damping = 2√(stiffness·mass), default mass 4), so the exit is quicker
const fadeOut = FadeOut.springify().stiffness(1600).damping(160)
const cardTransition = LinearTransition.springify(350).dampingRatio(1)

const habitIndexAtom = atom(get => createHabitIndex(get(habitsAtom)))
const habitCardsAtom = atom(get => buildHabitCards(get(habitsAtom), get(groupsAtom)))

const Search = () => {
  const navigation = useNavigation()
  const { top } = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim())
  const habits = useAtomValue(habitsAtom)
  const habitIndex = useAtomValue(habitIndexAtom)
  const cards = useAtomValue(habitCardsAtom)
  const [recentlyOpenedIds, setRecentlyOpenedIds] = useAtom(recentlyOpenedAtom)
  const [recentlyOpenedIdsOnOpen] = useState(recentlyOpenedIds)

  const isSearching = deferredQuery.length > 0
  const resultCards = useMemo(
    () => searchHabits(deferredQuery, habitIndex, habitId => isUpNextAnywhere(cards[habitId])).map(id => cards[id]),
    [deferredQuery, habitIndex, cards],
  )
  const recentCards = getRecentlyOpened(keepShownOrder(recentlyOpenedIds, recentlyOpenedIdsOnOpen), habits)
    .map(id => cards[id])
  const listedCards = isSearching ? resultCards : recentCards

  const countLabel = resultCards.length === 1 ? '1 habit' : `${resultCards.length} habits`
  const noMatchLabel = `No habits match “${deferredQuery}”.`
  const announcement = resultCards.length > 0 ? countLabel : noMatchLabel

  // Android announces through the live regions below; iOS has no equivalent prop
  useEffect(() => {
    if (Platform.OS === 'ios' && isSearching) AccessibilityInfo.announceForAccessibilityWithOptions(announcement, { queue: true })
  }, [isSearching, announcement])

  const openHabit = (habitId: string) => {
    setRecentlyOpenedIds(ids => withHabitOpened(ids, habitId, habits))
    const openSheet = () => void navigation.navigate('Habit', {
      habitId,
      withRotationsInitiallyExpanded: true,
      rotationRowPressReplacesScreenBelow: true,
      rotationRowPressNudgesHabit: true,
    })
    if (!Keyboard.isVisible()) {
      openSheet()
      return
    }

    // A sheet opened while the keyboard is up brings it back when it closes (react-native-screens restores
    // the focus on Android), which would pop it over the results, or over the Group that replaces Search.
    const subscription = Keyboard.addListener('keyboardDidHide', () => {
      subscription.remove()
      openSheet()
    })
    Keyboard.dismiss()
  }

  // keyed, so switching between the two headers fades one out and the other in rather than swapping the text
  const listHeader = isSearching ?
    resultCards.length > 0 && (
      <Animated.View key="count" entering={fadeInAt(0)} exiting={fadeOut}>
        <Text style={styles.label} accessibilityLiveRegion="polite">{countLabel}</Text>
      </Animated.View>
    ) :
    recentCards.length > 0 && (
      <Animated.View key="recent" entering={fadeInAt(0)} exiting={fadeOut} style={styles.recentHeader}>
        <Text style={styles.label}>Recently opened</Text>
        <Pressable onPress={() => void setRecentlyOpenedIds([])} hitSlop={12} accessibilityRole="button">
          {({ pressed }) => <Text style={[styles.clear, pressed && styles.pressed]}>Clear</Text>}
        </Pressable>
      </Animated.View>
    )

  return (
    <View style={[styles.screen, { paddingTop: top + 12 }]}>
      <SearchField value={query} onChangeText={setQuery} onCancel={() => void navigation.goBack()} />
      <KeyboardAvoidingView behavior="padding" style={styles.body}>
        <LayoutAnimationConfig skipEntering>
          {/* a ScrollView rather than a FlatList, whose header and footer can't take a layout transition */}
          <Animated.ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            style={styles.bleed}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {listHeader}
            {/* one card per habit across both lists, so a recent habit that matches stays the same card and
                brightens in place instead of being swapped for a new one */}
            {listedCards.map((card, index) => (
              <Animated.View key={card.habitId} entering={fadeInAt(index)} exiting={fadeOut} layout={cardTransition}>
                {/* the dim lives on its own view: a fade-in ends at full opacity and would override it */}
                <Animated.View style={{ opacity: isSearching ? 1 : DIMMED_OPACITY, ...opacityTransition }}>
                  <HabitResultCard card={card} onPress={() => void openHabit(card.habitId)} />
                </Animated.View>
              </Animated.View>
            ))}
            {isSearching && resultCards.length === 0 && (
              <Animated.View entering={fadeInAt(0)} exiting={fadeOut} style={styles.noMatch} accessibilityLiveRegion="polite">
                <Text style={styles.noMatchTitle}>{noMatchLabel}</Text>
                <Text style={styles.noMatchSub}>Search looks at habit names only.</Text>
              </Animated.View>
            )}
            {!isSearching && (
              <Animated.View entering={fadeInAt(listedCards.length)} exiting={fadeOut} layout={cardTransition}>
                <Text style={styles.hint}>Type part of a habit’s name.</Text>
              </Animated.View>
            )}
          </Animated.ScrollView>
        </LayoutAnimationConfig>
      </KeyboardAvoidingView>
      <UndoToast />
    </View>
  )
}

export default Search

const styles = StyleSheet.create(theme => ({
  screen: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  body: {
    flex: 1,
  },
  // escape the screen's horizontal padding so card shadows fade out before the list clips them
  bleed: {
    marginHorizontal: -theme.spacing.xl,
  },
  list: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing['2xl'],
    gap: theme.spacing.md,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textSecondaryStrong,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clear: {
    ...theme.typography.label,
    color: theme.colors.accentText,
  },
  pressed: {
    opacity: 0.6,
  },
  hint: {
    fontFamily: theme.fonts.serifItalic,
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.textSecondaryStrong,
    marginTop: theme.spacing.sm,
  },
  noMatch: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing['3xl'],
  },
  noMatchTitle: {
    ...theme.typography.body,
    fontSize: 18,
    lineHeight: 24,
    color: theme.colors.text,
    textAlign: 'center',
  },
  noMatchSub: {
    ...theme.typography.caption,
    color: theme.colors.textSecondaryStrong,
    textAlign: 'center',
  },
}))
