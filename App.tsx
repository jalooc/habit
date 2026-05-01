import { light as theme } from 'src/domains/misc/utils/theme'
import 'src/domains/notifications/utils/notifications'
import 'src/domains/notifications/utils/habitsNotificationsScheduler'
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
import * as Notifications from 'src/domains/notifications/utils/notifications'
import Home from 'src/domains/misc/screens/Home'
import Group from 'src/domains/groups/screens/Group'
import DevTools from 'src/domains/devTools/screens/DevTools'
import DevLog from 'src/domains/devTools/screens/DevLog'
import DevLogEntry from 'src/domains/devTools/screens/DevLogEntry'
import Backup from 'src/domains/devTools/screens/Backup'
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation'
import { setupNotifications } from 'src/domains/notifications/utils/notifications'

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
    Group: {
      screen: Group,
      options: { headerTitle: '' },
      linking: { path: 'group/:id' },
    },
    DevTools: {
      screen: DevTools,
      options: { headerTitle: 'Dev Tools' },
    },
    DevLog: {
      screen: DevLog,
      options: { headerTitle: 'Log' },
    },
    DevLogEntry: {
      screen: DevLogEntry,
      options: { headerTitle: 'Log entry' },
    },
    Backup: {
      screen: Backup,
      options: { headerTitle: 'Backup' },
    },
  },
})

type RootStackParamList = StaticParamList<typeof RootStack>

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {
    }
  }
}

const Navigation = createStaticNavigation(RootStack)

const App = () => {
  const navigationRef = useNavigationContainerRef()

  useReactNavigationDevTools(navigationRef)

  useEffect(() => {
    void setupNotifications()
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
        subscribe: listener => {
          const onReceiveURL = ({ url }: { url: string }) => void listener(url)

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
