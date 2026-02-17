import { light as theme } from './src/theme'
import './src/notifications'
import * as React from 'react'
import { useEffect } from 'react'
import {
  createStaticNavigation,
  DefaultTheme,
  StaticParamList,
  useNavigationContainerRef,
} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Linking } from 'react-native'
import * as ExpoLinking from 'expo-linking'
import * as Notifications from 'expo-notifications'
import Home from './src/screens/Home'
import Email from './src/screens/Email'
import Address from './src/screens/Address'
import Group from './src/screens/Group'
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation'
import { setupNotifications } from './src/notifications'

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
      linking: { path: 'group/:id' },
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
  const navigationRef = useNavigationContainerRef()

  useReactNavigationDevTools(navigationRef)

  useEffect(() => {
    setupNotifications()
  }, [])

  return (
    <Navigation
      ref={navigationRef}
      theme={navigationTheme}
      linking={{
        config: {},
        prefixes: [ExpoLinking.createURL('/')],
        getInitialURL: async () => {
          // Check if app was opened from a deep link
          const url = await Linking.getInitialURL()

          if (url != null) {
            return url
          }

          // Handle URL from expo push notifications
          const response = Notifications.getLastNotificationResponse()

          return response?.notification.request.content.data.url?.toString() ?? undefined
        },
        subscribe: (listener) => {
          const onReceiveURL = ({ url }: { url: string }) => listener(url)

          // Listen to incoming links from deep linking
          const eventListenerSubscription = Linking.addEventListener('url', onReceiveURL)

          // Listen to expo push notifications
          const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const url = response.notification.request.content.data.url

            // Let React Navigation handle the URL
            if (typeof url === 'string') listener(url)
          })

          return () => {
            // Clean up the event listeners
            eventListenerSubscription.remove()
            subscription.remove()
          }
        },
      }}
    />
  )
}

export default App
