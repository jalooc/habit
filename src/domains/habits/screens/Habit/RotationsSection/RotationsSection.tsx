import { useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { StackActions } from '@react-navigation/native'
import { StyleSheet } from 'react-native-unistyles'
import { useObservable, useValue } from '@legendapp/state/react'
import Lucide from '@react-native-vector-icons/lucide'
import groups$ from 'src/domains/habits/stores/groups'
import habits$ from 'src/domains/habits/stores/habits'
import { GROUP_ID_PARAM } from 'src/domains/habits/utils/linking'
import orderQueue from 'src/domains/habits/utils/orderQueue'
import formatCadence from 'src/domains/habits/utils/formatCadence'
import { formatStanding } from './rotationStanding'
import RotationRow from './RotationRow'
import { useNativeStackNavigation } from 'src/domains/misc/utils/navigation'
import RoundToggle from './RoundToggle'

type Props = {
  habitId: string,
}

const RotationsSection = ({ habitId }: Props) => {
  const navigation = useNativeStackNavigation()
  const expanded$ = useObservable(false)
  const manage$ = useObservable(false)
  const expanded = useValue(expanded$)
  const manage = useValue(manage$)
  const groupsMap = useValue(groups$)
  const habitsMap = useValue(habits$)

  const memberGroups = Object.keys(groupsMap)
    .filter(id => habitId in groupsMap[id].habits)
    .map(id => {
      const group = groupsMap[id]
      const habitIds = Object.keys(group.habits)
      return {
        id,
        name: group.name,
        cadenceLabel: group.recurrence ? formatCadence(group.recurrence) : null,
        count: habitIds.length,
        standingIndex: orderQueue(habitIds, habitsMap).indexOf(habitId),
      }
    })

  const availableGroups = Object.keys(groupsMap)
    .filter(id => !(habitId in groupsMap[id].habits))
    .map(id => {
      const group = groupsMap[id]
      return {
        id,
        name: group.name,
        cadenceLabel: group.recurrence ? formatCadence(group.recurrence) : null,
        count: Object.keys(group.habits).length,
      }
    })

  if (memberGroups.length === 0) return null

  const single = memberGroups.length === 1
  const canRemove = memberGroups.length > 1
  const canAdd = availableGroups.length > 0
  // Manage stays reachable whenever it can do something — join a rotation or leave one. It's only
  // hidden for a lone rotation, since we don't orphan or delete the habit from here.
  const showManageEntry = canAdd || canRemove
  const manageEntryLabel = single ? 'Add to another rotation' : 'Manage rotations'
  const manageEntryIcon = single ? 'plus' : 'pencil'

  // Open the rotation's Group. If it's already below in the stack, dismiss the sheet down onto it
  // (the native sheet-dismiss). Otherwise, we can't push/replace straight to it: forward navigation
  // from a formSheet doesn't animate on Android, and inserting the Group beneath the live sheet to
  // dismiss-and-reveal crashes Fabric (reparents the sheet view). So dismiss the sheet, then push
  // the Group on the next frame — it slides in over the revealed screen. The two must be separate
  // commits, else they batch into a non-animating replace. Final stack matches replace's, so Back
  // still skips the sheet.
  const goToGroup = (groupId: string) => {
    const { routes } = navigation.getState()
    const targetIndex = routes.findLastIndex(
      route => route.name === 'Group' && getRouteGroupId(route.params) === groupId,
    )

    if (targetIndex !== -1) {
      navigation.dispatch(StackActions.pop(routes.length - 1 - targetIndex))
      return
    }

    navigation.goBack()
    requestAnimationFrame(() =>
      void navigation.dispatch(StackActions.push('Group', { [GROUP_ID_PARAM]: groupId })),
    )
  }

  return (
    <Animated.View style={styles.section} layout={layoutTransition}>
      <View style={styles.topDivider} />

      {manage ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          <View style={styles.manageHeader}>
            <Text style={styles.kickerPlain}>Manage rotations</Text>
            <Pressable onPress={() => void manage$.set(false)} hitSlop={8}>
              {({ pressed }) => (
                <Text style={[styles.done, pressed && styles.pressedText]}>Done</Text>
              )}
            </Pressable>
          </View>

          {memberGroups.map((group, index) => (
            <Animated.View key={group.id} layout={layoutTransition} entering={FadeIn} exiting={FadeOut}>
              <RotationRow
                name={group.name}
                cadenceLabel={group.cadenceLabel}
                meta={formatStanding(group.standingIndex)}
                emphasizeMeta={group.standingIndex === 0}
                count={group.count}
                litIndex={group.standingIndex}
                divider={index > 0 ? 'solid' : undefined}
                trailing={
                  <RoundToggle
                    kind="remove"
                    disabled={!canRemove}
                    onPress={() => void groups$[group.id].habits[habitId].delete()}
                  />
                }
              />
            </Animated.View>
          ))}

          {availableGroups.length > 0 && (
            <>
              <Text style={styles.addToLabel}>Add to</Text>
              {availableGroups.map(group => (
                <Animated.View key={group.id} layout={layoutTransition} entering={FadeIn} exiting={FadeOut}>
                  <RotationRow
                    name={group.name}
                    cadenceLabel={group.cadenceLabel}
                    meta={group.count === 1 ? '1 habit' : `${group.count} habits`}
                    count={group.count}
                    litIndex={null}
                    trailing={
                      <RoundToggle
                        kind="add"
                        onPress={() => void groups$[group.id].habits[habitId].set(true)}
                      />
                    }
                  />
                </Animated.View>
              ))}
            </>
          )}
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={styles.collapsed}
        >
          <Pressable style={styles.header} onPress={() => void expanded$.toggle()}>
            {({ pressed }) => (
              <View style={[styles.headerContent, pressed && styles.pressed]}>
                <Text style={styles.kicker} numberOfLines={1}>
                  {'In '}
                  <Text style={styles.kickerAccent}>{single ? memberGroups[0].name : memberGroups.length}</Text>
                  {single ? ' rotation' : ' rotations'}
                </Text>
                <Chevron expanded={expanded} />
              </View>
            )}
          </Pressable>

          {expanded && (
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.body}>
              {memberGroups.map((group, index) => (
                <Animated.View key={group.id} layout={layoutTransition} entering={FadeIn} exiting={FadeOut}>
                  <RotationRow
                    name={group.name}
                    cadenceLabel={group.cadenceLabel}
                    meta={formatStanding(group.standingIndex)}
                    emphasizeMeta={group.standingIndex === 0}
                    count={group.count}
                    litIndex={group.standingIndex}
                    divider={index > 0 ? 'dashed' : undefined}
                    onPress={() => void goToGroup(group.id)}
                    trailing={<Lucide name="chevron-right" size={18} style={styles.rowChevron} />}
                  />
                </Animated.View>
              ))}

              {showManageEntry && (
                <Pressable
                  style={[styles.addRow, !single && styles.addRowDivider]}
                  onPress={() => void manage$.set(true)}
                >
                  {({ pressed }) => (
                    <View style={[styles.addRowContent, pressed && styles.pressed]}>
                      <View style={styles.addCircle}>
                        <Lucide name={manageEntryIcon} size={15} style={styles.addCircleIcon} />
                      </View>
                      <Text style={styles.addLabel}>{manageEntryLabel}</Text>
                    </View>
                  )}
                </Pressable>
              )}
            </Animated.View>
          )}
        </Animated.View>
      )}
    </Animated.View>
  )
}

export default RotationsSection

const layoutTransition = LinearTransition.springify().damping(14).stiffness(110).mass(0.85)

const getRouteGroupId = (params: Record<string, unknown> | undefined): unknown =>
  params?.[GROUP_ID_PARAM]

type ChevronProps = {
  expanded: boolean,
}

const Chevron = ({ expanded }: ChevronProps) => {
  const rotation = useSharedValue(expanded ? 0 : -90)

  useEffect(() => {
    rotation.value = withTiming(expanded ? 0 : -90, { duration: 200 })
  }, [expanded])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  return (
    <Animated.View style={animatedStyle}>
      <Lucide name="chevron-down" size={16} style={styles.chevron} />
    </Animated.View>
  )
}

const styles = StyleSheet.create(theme => ({
  section: {
    gap: theme.spacing.xs,
  },
  collapsed: {
    gap: theme.spacing.xs,
  },
  topDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  header: {
    paddingVertical: theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  pressed: {
    opacity: 0.6,
  },
  pressedText: {
    opacity: 0.6,
  },
  kicker: {
    flexShrink: 1,
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: theme.colors.textSecondary,
  },
  kickerAccent: {
    color: theme.colors.accent,
  },
  chevron: {
    color: theme.colors.textSecondary,
  },
  body: {
    paddingBottom: theme.spacing.xs,
  },
  rowChevron: {
    color: theme.colors.textTertiary,
  },
  manageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 2,
  },
  kickerPlain: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: theme.colors.textSecondary,
  },
  done: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.colors.accent,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  addToLabel: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: theme.colors.textTertiary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
    paddingHorizontal: 2,
  },
  addRow: {
    paddingTop: theme.spacing.md,
    paddingBottom: 2,
  },
  addRowDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.xs,
  },
  addRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 2,
  },
  addCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCircleIcon: {
    color: theme.colors.accent,
  },
  addLabel: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: theme.colors.accent,
  },
}))
