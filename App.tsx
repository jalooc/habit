import { light as theme } from './src/theme'
import * as React from 'react'
import {
  createStaticNavigation,
  DefaultTheme,
  StaticParamList,
  useNavigationContainerRef,
} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Home from './src/screens/Home'
import Email from './src/screens/Email'
import Address from './src/screens/Address'
import Group from './src/screens/Group'
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation'

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.accent,
    background: theme.colors.background,
    card: theme.colors.background,
    text: theme.colors.text,
    border: theme.colors.border,
  },
}

const RootStack = createNativeStackNavigator({
  screenOptions: {
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  },
  screens: {
    Home: {
      screen: Home,
      options: { headerShown: false },
    },
    Email,
    Address,
    Group: {
      screen: Group,
      options: { headerTitle: '' },
    },
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

  return <Navigation ref={navigationRef} theme={navigationTheme} />
}

export default App
