import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export const setupNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  return requestPermissions()
}

const requestPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()

  if (existingStatus === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()

  return status === 'granted'
}