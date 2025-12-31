import { Text, View } from 'react-native'
import * as React from 'react'
import { StaticScreenProps } from '@react-navigation/native'
import Menu from '../components/Menu'

type Props = StaticScreenProps<{
  address: string;
}>;

const Address = (props: Props) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>First Screen</Text>
    <Menu />
  </View>
)

export default Address
