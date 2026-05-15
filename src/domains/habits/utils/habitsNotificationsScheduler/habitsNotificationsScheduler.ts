import * as Notifications from 'src/domains/notifications/utils/notifications'
import buildNotifications from './buildNotifications'
import { devLog } from 'src/domains/devTools/utils/devLog'
import groups$ from 'src/domains/habits/stores/groups'
import habits$ from 'src/domains/habits/stores/habits'
import dayBoundaries$ from 'src/domains/misc/stores/dayBoundaries'
import { serializeError } from 'serialize-error'
import pDebounce from 'p-debounce'

const resetNotifications = async (notifications: ReturnType<typeof buildNotifications>) => {
  await Notifications.cancelAllScheduledNotificationsAsync()
  await Promise.all(notifications.map(n =>
    Notifications.scheduleNotificationAsync({
      content: {
        title: n.title,
        body: n.body,
        data: n.data,
        interruptionLevel: 'active',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: n.date,
        channelId: 'reminders',
      },
    }),
  ))
}

const reschedule = pDebounce.promise(async () => {
  try {
    const notifications = buildNotifications(groups$.get(), habits$.get())
    devLog('rescheduling notifications', { notifications })
    await resetNotifications(notifications)
  } catch (rawError) {
    const error = serializeError(rawError)
    devLog('failed to reschedule notifications', { error })
  }
}, { after: true })

groups$.onChange(reschedule)
habits$.onChange(reschedule)
dayBoundaries$.onChange(reschedule)

Notifications.addNotificationReceivedListener(async () => {
  const pending = await Notifications.getAllScheduledNotificationsAsync()
  if (pending.length === 0) await reschedule()
})
