import { light as theme } from 'src/domains/misc/utils/theme'
import 'src/domains/notifications/utils/notifications'
import 'src/domains/habits/utils/habitsNotificationsScheduler'
import { useEffect } from 'react'
import {
  DefaultTheme,
  useNavigationContainerRef,
} from '@react-navigation/native'
import { Linking } from 'react-native'
import * as ExpoLinking from 'expo-linking'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Notifications from 'src/domains/notifications/utils/notifications'
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation'
import { setupNotifications } from 'src/domains/notifications/utils/notifications'
import { devLog } from 'src/domains/devTools/utils/devLog'
import { isNonNullish } from 'remeda'
import { Navigation } from 'src/domains/misc/utils/navigation'
import { cleanupPendingImages } from 'src/domains/habits/utils/usePendingImages'
import { cleanupOrphanedImages } from 'src/domains/habits/utils/habitImages'

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

const App = () => {
  const navigationRef = useNavigationContainerRef()

  useReactNavigationDevTools(navigationRef)

  useEffect(() => {
    void setupNotifications()
    cleanupOrphanedImages()
    cleanupPendingImages()
  }, [])

  return (
    <GestureHandlerRootView>
      <Navigation
        ref={navigationRef}
        theme={navigationTheme}
        linking={{
          config: {
            initialRouteName: 'Home',
          },
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

            const notificationUrl = response?.notification.request.content.data?.url
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
              const notificationUrl = response.notification.request.content.data?.url
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
    </GestureHandlerRootView>
  )
}

export default App
