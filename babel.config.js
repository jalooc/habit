/** @type {import('@babel/core').ConfigFunction} */
// eslint-disable-next-line no-undef
module.exports = api => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['react-native-unistyles/plugin', {
        root: 'src',
      }],
    ],
  }
}
