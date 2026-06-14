import { ReactNode } from 'react'
import { useSelector, useValue } from '@legendapp/state/react'
import { FlatList, Text, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useLinkProps } from '@react-navigation/native'
import groups$ from 'src/domains/habits/stores/groups'
import habits$ from 'src/domains/habits/stores/habits'
import orderQueue from 'src/domains/habits/utils/orderQueue'
import OrbitMini from './OrbitMini'
import isGroupDue from 'src/domains/habits/utils/groupDueness'
import formatCadence from 'src/domains/habits/utils/formatCadence'

type Props = {
  footer?: ReactNode,
}

const Groups = ({ footer }: Props) => {
  const groupIds = useSelector(() => Object.keys(groups$.get()))

  return (
    <FlatList
      data={groupIds}
      renderItem={({ item: groupId }) => <GroupCard id={groupId} />}
      keyExtractor={id => id}
      // Android clips each cell's soft boxShadow into a hard-edged band between cards
      removeClippedSubviews={false}
      style={listStyles.bleed}
      contentContainerStyle={listStyles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<EmptyState />}
      ListFooterComponent={footer ? <>{footer}</> : null}
    />
  )
}

export default Groups

const listStyles = StyleSheet.create(theme => ({
  // escape Box's horizontal padding so card shadows fade out before the scroll container clips them
  bleed: {
    marginHorizontal: -theme.spacing.xl,
  },
  list: {
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
}))

type GroupCardProps = {
  id: string,
}

const GroupCard = ({ id }: GroupCardProps) => {
  const linkProps = useLinkProps({ screen: 'Group', params: { id }})
  const { recurrence } = useValue(groups$[id])

  const cardData = useSelector(() => {
    const group = groups$[id].get()
    const habitsMap = habits$.get()
    const habitIds = Object.keys(group.habits)
    const ordered = orderQueue(habitIds, habitsMap)

    const upNextId = ordered[0]
    const upNextName = upNextId ? habitsMap[upNextId].name : null
    const upNextLastActioned = upNextId ? habitsMap[upNextId].lastActioned?.timestamp : undefined
    const due = isGroupDue({ recurrence, upNextLastActioned, now: new Date() })
    const cadenceLabel = recurrence ? formatCadence(recurrence) : null
    const habitCount = habitIds.length

    return { name: group.name, habitCount, cadenceLabel, upNextName, due }
  })

  const { name, habitCount, cadenceLabel, upNextName, due } = cardData
  const metaLine = cadenceLabel ?
    `${cadenceLabel} · ${habitCount} ${habitCount === 1 ? 'habit' : 'habits'}` :
    `${habitCount} ${habitCount === 1 ? 'habit' : 'habits'}`

  return (
    <Pressable
      style={({ pressed }) => [cardStyles.container, pressed && cardStyles.pressed]}
      {...linkProps}
    >
      <OrbitMini count={habitCount} size={72} />
      <View style={cardStyles.textArea}>
        <Text style={cardStyles.name}>{name}</Text>
        <Text style={cardStyles.meta}>{metaLine}</Text>
        {upNextName !== null && (
          <View style={cardStyles.upNextRow}>
            {due && <View style={cardStyles.dueDot} />}
            <Text style={[cardStyles.upNext, due && cardStyles.upNextDue]}>
              {'Up next · '}{upNextName}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  )
}

const cardStyles = StyleSheet.create(theme => ({
  container: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  textArea: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...theme.typography.heading,
    fontFamily: theme.fonts.serifItalic,
    color: theme.colors.text,
  },
  meta: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  upNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dueDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
  },
  upNext: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  upNextDue: {
    color: theme.colors.accent,
  },
}))

const EmptyState = () => (
  <View style={emptyStyles.container}>
    <Text style={emptyStyles.heading}>Nothing in orbit yet.</Text>
    <Text style={emptyStyles.body}>
      A rotation is a small set of related habits that take turns. Make one to begin.
    </Text>
  </View>
)

const emptyStyles = StyleSheet.create(theme => ({
  container: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  heading: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
  body: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
}))
