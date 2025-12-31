import * as React from 'react'
import { createStaticNavigation, StaticParamList, useNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Home from './src/screens/Home'
import Email from './src/screens/Email'
import Address from './src/screens/Address'
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation'

const RootStack = createNativeStackNavigator({
  screens: {
    Home,
    Email,
    Address,
  },
})

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {
    }
  }
}

const Navigation = createStaticNavigation(RootStack)

const App = () => {
  const navigationRef = useNavigationContainerRef();

  useReactNavigationDevTools(navigationRef);
  
  return <Navigation ref={navigationRef} />
}

export default App
