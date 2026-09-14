import { Text, View } from 'react-native'
import * as Application from 'expo-application'
import { use } from 'react'
import dayjs from 'dayjs'
import { StyleSheet } from 'react-native-unistyles'

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

const installationTimePromise = Application.getInstallationTimeAsync()
const lastUpdateTimePromise = Application.getLastUpdateTimeAsync()

const AppMetadata = () => {
  const installationTime = use(installationTimePromise)
  const lastUpdateTime = use(lastUpdateTimePromise)

  const data = {
    Name: Application.applicationName,
    ID: Application.applicationId,
    Version: Application.nativeApplicationVersion,
    'Build version': Application.nativeBuildVersion,
    'Android ID': Application.getAndroidId(),
    'Installation time': dayjs(installationTime).format(DATE_FORMAT),
    'Last update time': dayjs(lastUpdateTime).format(DATE_FORMAT),
  }

  return (
    <View style={styles.container}>
      {Object.entries(data).map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.label}>{label}:</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </View>
  )
}

export default AppMetadata

export const BORDER_COLOR_NAME = 'border'

const styles = StyleSheet.create(theme => ({
  container: {
    gap: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors[BORDER_COLOR_NAME],
    padding: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  value: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
}))
