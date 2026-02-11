import { StaticScreenProps } from '@react-navigation/native'
import { FlatList, Text, TextInput, View } from 'react-native'
import { useObservable, useValue } from '@legendapp/state/react'
import { groups$, habits$ } from '../stores'
import Box from '../components/Box'
import { StyleSheet } from 'react-native-unistyles'
import Button from '../components/Button'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useRef } from 'react'
import { $TextInput } from '@legendapp/state/react-native'
import * as React from 'react'
import { randomUUID } from 'expo-crypto'

type Props = StaticScreenProps<{
  id: string;
}>;

const Group = ({ route }: Props) => {
  const groupId = route.params.id
  const { name, habits } = useValue(groups$[groupId])

  return (
    <Box>
      <Text style={styleSheet.title}>
        {name}
      </Text>
      <FlatList
        data={Object.keys(habits)}
        renderItem={({ item: id }) => <Habit id={id}/>}
        ListEmptyComponent={<Text>Add first habit</Text>}
        ListFooterComponent={<AddHabit groupId={groupId}/>}
      />
    </Box>
  )
}

export default Group

const Habit = ({ id }: { id: string }) => {
  const { name } = useValue(habits$[id])

  return (
    <View style={styleSheet.habitContainer}>
      <Text>{name}</Text>
    </View>
  )
}

const AddHabit = ({ groupId }: { groupId: string }) => {
  const newHabitName$ = useObservable('')
  const inputRef = useRef<TextInput>(null)
  const sheetRef = useRef<TrueSheet>(null)

  const addHabit = () => {
    sheetRef.current?.dismiss()
    const newHabitName = newHabitName$.get()
    setTimeout(() => {
      const newHabitId = randomUUID()
      habits$[newHabitId].set({ name: newHabitName })
      groups$[groupId].habits[newHabitId].set(true)
    }, 500)
  }

  return (
    <>
      <Button title="Add another habit" onPress={() => sheetRef.current?.present()}/>
      <TrueSheet
        ref={sheetRef}
        detents={['auto']}
        onDidDismiss={() => newHabitName$.set('')}
      >
        <View style={styleSheet.sheet}>
          <$TextInput
            style={styleSheet.input}
            $value={newHabitName$}
            ref={inputRef}
            onKeyPress={e => {
              if (e?.nativeEvent.key === 'Enter') {
                addHabit()
              }
            }}
          />
          <Button title="Confirm" onPress={addHabit}/>
        </View>
      </TrueSheet>
    </>
  )
}

const styleSheet = StyleSheet.create({
  title: {
    fontSize: 32,
  },
  habitContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    borderStyle: 'solid',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  input: {
    borderStyle: 'solid',
    borderWidth: 1,
    padding: 10,
    width: 200,
  },
  sheet: {
    gap: 50,
    paddingInline: 50,
    paddingBlock: 100,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
})

