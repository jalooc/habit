import { ReactNode } from 'react'
import { useValue } from '@legendapp/state/react'
import { FlatList, Text, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useLinkProps } from '@react-navigation/native'
import groups$ from 'src/domains/habits/stores/groups'

type Props = {
  footer?: ReactNode,
}

const Groups = ({ footer }: Props) => {
  const groups = useValue(groups$)

  return (
    <FlatList
      data={Object.entries(groups)}
      renderItem={({ item: [groupId, group] }) => (
        <GroupCard
          id={groupId}
          {...group}
        />
      )}
      contentContainerStyle={listStyles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<EmptyState />}
      ListFooterComponent={footer ? <>{footer}</> : null}
    />
  )
}

export default Groups

const listStyles = StyleSheet.create(theme => ({
  list: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
}))

type GroupCardProps = {
  id: string,
  name: string,
  habits: Record<string, true>,
}

const GroupCard = ({ id, name, habits }: GroupCardProps) => {
  const linkProps = useLinkProps({ screen: 'Group', params: { id }})
  const habitCount = Object.keys(habits).length

  return (
    <Pressable
      style={({ pressed }) => [
        cardStyles.container,
        cardStyles.pastel(id),
        pressed && cardStyles.pressed,
      ]}
      {...linkProps}
    >
      <View style={cardStyles.textArea}>
        <Text style={cardStyles.name}>{name}</Text>
        <Text style={cardStyles.count}>
          {habitCount} {habitCount === 1 ? 'habit' : 'habits'}
        </Text>
      </View>
      <Text style={cardStyles.chevron}>›</Text>
    </Pressable>
  )
}

const cardStyles = StyleSheet.create(theme => ({
  container: {
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pastel: (id: string) => {
    const { bg, border } = theme.pastelOf(id)
    return { backgroundColor: bg, borderColor: border }
  },
  pressed: {
    opacity: 0.6,
  },
  textArea: {
    flex: 1,
  },
  name: {
    ...theme.typography.heading,
    fontFamily: theme.fonts.serifItalic,
    color: theme.colors.text,
    marginBottom: 2,
  },
  count: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: theme.colors.textTertiary,
    marginLeft: theme.spacing.sm,
  },
}))

const EmptyState = () => (
  <View style={emptyStyles.container}>
    <Text style={emptyStyles.text}>Create your first group to get started</Text>
  </View>
)

const emptyStyles = StyleSheet.create(theme => ({
  container: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.textTertiary,
  },
}))
