import { Text, TextInput, View } from 'react-native'
import * as React from 'react'
import { StaticScreenProps } from '@react-navigation/native'
import Menu from '../../components/Menu'
import { $TextInput } from '@legendapp/state/react-native'
import { useObservable } from '@legendapp/state/react'
import { groups$ } from '../../stores'
import { randomUUID } from 'expo-crypto'
import { StyleSheet } from 'react-native-unistyles'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useRef } from 'react'
import Button from '../../components/Button'
import Box from '../../components/Box'
import Groups from './Groups'


type Props = StaticScreenProps<{
  username: string;
}>;

const Home = (props: Props) => (
  <Box>
    <Text>Home Screen</Text>
    <Menu />
    <NewGroupSheet />
    <Groups />
  </Box>
)

export default Home

const NewGroupSheet = () => {
  const newGroupName$ = useObservable('')
  const inputRef = useRef<TextInput>(null)
  const sheetRef = useRef<TrueSheet>(null)

  const addGroup = () => {
    sheetRef.current?.dismiss()
    let newGroupName = newGroupName$.get()
    setTimeout(() => groups$[randomUUID()].set({ name: newGroupName, habits: {} }), 500)
  }

  return (
    <>
      <Button title="Add group" onPress={() => sheetRef.current?.present()}/>
      <TrueSheet
        ref={sheetRef}
        detents={['auto']}
        onDidPresent={() => {
          inputRef.current?.focus()
        }}
        onDidDismiss={() => newGroupName$.set('')}
      >
        <View style={styleSheet.sheet}>
          <$TextInput
            style={styleSheet.input}
            $value={newGroupName$}
            ref={inputRef}
            onKeyPress={e => {
              if (e?.nativeEvent.key === 'Enter') {
                addGroup()
              }
            }}
          />
          <Button title="Confirm" onPress={addGroup}/>
        </View>
      </TrueSheet>
    </>
  )
}

const styleSheet = StyleSheet.create({
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
