import * as Notifications from 'expo-notifications'
import { SchedulableTriggerInputTypes } from 'expo-notifications'
import { groups$, habits$, dayBoundaries$ } from '../../stores'
import buildNotifications from './buildNotifications'
import { devLog } from '../../domains/devTools/utils/devLog'
import { scheduleNotificationAsyncForChannel } from '../../notifications'

const resetNotifications = async (notifications: ReturnType<typeof buildNotifications>) => {
  await Notifications.cancelAllScheduledNotificationsAsync()
  await Promise.all(notifications.map(n =>
    scheduleNotificationAsyncForChannel({
      content: {
        title: n.title,
        body: n.body,
        data: n.data,
        interruptionLevel: 'active',
      },
      trigger: { 
        type: SchedulableTriggerInputTypes.DATE, 
        date: n.date,
        channelId: 'reminders'
      },
    }),
  ))
}

const reschedule = async () => {
  try {
    const notifications = buildNotifications(groups$.get(), habits$.get())
    await resetNotifications(notifications)
  } catch (error) {
    devLog('failed to reschedule notifications', { error })
  }
}

groups$.onChange(() => reschedule())
habits$.onChange(() => reschedule())
dayBoundaries$.onChange(() => reschedule())

Notifications.addNotificationReceivedListener(async () => {
  const pending = await Notifications.getAllScheduledNotificationsAsync()
  if (pending.length === 0) await reschedule()
})
