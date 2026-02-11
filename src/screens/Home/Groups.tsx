import { useValue } from '@legendapp/state/react'
import { groups$ } from '../../stores'
import { FlatList, Text, Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useLinkProps } from '@react-navigation/native'

type Props = {}

const Groups = ({}: Props) => {
  const groups = useValue(groups$)

  return (
    <FlatList
      data={Object.entries(groups)}
      renderItem={({ item: [groupId, group] }) => (
        <Group id={groupId} {...group} />
      )}
    />
  )
}

export default Groups

type HabitId = string

type GroupProps = {
  id: string
  name: string
  habits: Record<HabitId, true>
}

const Group = ({ id, name, habits }: GroupProps) => {
  const linkProps = useLinkProps({ screen: 'Group', params: { id } })
  
  return (
    <Pressable
      style={styleSheet.groupContainer}
      {...linkProps}
    >
      <Text style={styleSheet.groupName}>{name}</Text>
      <Text style={styleSheet.habitsCount}>{Object.keys(habits).length} habits</Text>
    </Pressable>
  )
}

const styleSheet = StyleSheet.create({
  groupContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    borderStyle: 'solid',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  habitsCount: {
    fontSize: 14,
    color: '#666666',
  },
})
