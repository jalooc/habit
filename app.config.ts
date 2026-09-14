import { ExpoConfig } from 'expo/config'

import { version } from './package.json'

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  version,
})
