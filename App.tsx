import { light as theme } from 'src/domains/misc/utils/theme'
import 'src/domains/notifications/utils/notifications'
import 'src/domains/habits/utils/habitsNotificationsScheduler'
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
import Group from 'src/domains/habits/screens/Group'
import DevTools from 'src/domains/devTools/screens/DevTools'
import DevLog from 'src/domains/devTools/screens/DevLog'
import DevLogEntry from 'src/domains/devTools/screens/DevLogEntry'
import Backup from 'src/domains/devTools/screens/Backup'
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation'
import { setupNotifications } from 'src/domains/notifications/utils/notifications'
import { devLog } from 'src/domains/devTools/utils/devLog'
import { isNonNullish } from 'remeda'
import { groupScreenLinkPlaceholder } from 'src/domains/habits/utils/linking'

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
      linking: {
        path: groupScreenLinkPlaceholder,
        initialRouteName: 'Home',
      },
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
          const initialUrl = await Linking.getInitialURL()

          if (isNonNullish(initialUrl)) {
            devLog('notification: getInitialURL', { initialUrl })
            return initialUrl
          }

          // Handle URL from expo push notifications
          const response = Notifications.getLastNotificationResponse()

          const notificationUrl = response?.notification.request.content.data.url
          const fullUrl = typeof notificationUrl === 'string' ? ExpoLinking.createURL(notificationUrl) : undefined

          devLog('notification: getInitialURL', { notificationUrl, fullUrl, response })

          return fullUrl
        },
        subscribe: listener => {
          // Listen to incoming links from deep linking
          const eventListenerSubscription = Linking.addEventListener('url', ({ url }) => {
            devLog('notification: RN linking event listener', { url })

            void listener(url)
          })

          // Listen to expo push notifications
          const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const notificationUrl = response.notification.request.content.data.url
            const fullUrl = typeof notificationUrl === 'string' ? ExpoLinking.createURL(notificationUrl) : undefined

            devLog('notification: Expo push notification listener', { notificationUrl, fullUrl, response })

            // Let React Navigation handle the URL
            if (isNonNullish(fullUrl)) {
              listener(fullUrl)
            }
          })

          return () => {
            eventListenerSubscription.remove()
            subscription.remove()
          }
        },
      }}
    />
  )
}

export default App
