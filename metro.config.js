/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-call, no-undef, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

// Learn more https://docs.expo.io/guides/customizing-metro
const { withRozenite } = require('@rozenite/metro')
const { getDefaultConfig } = require('expo/metro-config')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

module.exports = withRozenite(config, { enabled: process.env.WITH_ROZENITE === 'true' })
