import { StyleSheet } from 'react-native-unistyles'
import { GeneralizeConst } from 'src/domains/misc/utils/typesUtilities'

// Must match PostScript names (nid=6) baked into each TTF — verify with fc-query after upgrading @expo-google-fonts.
const fontFamilies = {
  serif: 'Fraunces-Regular',
  serifItalic: 'Fraunces-Italic',
  sans: 'Inter-Regular',
  sansMedium: 'Inter-Medium',
} as const

// 20 hues stepped 12° across the red→blue arc (no violets/pinks)
const pastelHues = Array.from({ length: 20 }, (_, i) => i * 12)

const pastelsLight = pastelHues.map(hue => ({
  bg: `hsl(${hue}, 85%, 96%)`,
  border: `hsl(${hue}, 72%, 72%)`,
}))

// Dimmed variants so near-white text stays readable on pastel surfaces
const pastelsDark = pastelHues.map(hue => ({
  bg: `hsl(${hue}, 28%, 21%)`,
  border: `hsl(${hue}, 35%, 40%)`,
}))

const hashWithDjb2 = (s: string) =>
  Array.from(s).reduce((h, c) => ((h << 5) + h + c.charCodeAt(0)) | 0, 5381)

const pastelOfFrom = (pastels: typeof pastelsLight) => (id: string) =>
  pastels[Math.abs(hashWithDjb2(id)) % pastels.length]

const lh = (size: number, ratio: number) => Math.round(size * ratio)

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const

// Design-system intent per size: xl hero cards, lg list cards, md secondary/inner cards,
// sm subtle blocks, xs single inputs, pill buttons/chips/badges.
const radii = {
  xl: 28,
  lg: 22,
  md: 18,
  sm: 16,
  xs: 14,
  pill: 100,
} as const

const typography = {
  title: {
    fontFamily: fontFamilies.serif,
    fontSize: 32,
    fontWeight: '400',
    lineHeight: lh(32, 1.1),
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: fontFamilies.serif,
    fontSize: 22,
    fontWeight: '400',
    lineHeight: lh(22, 1.1),
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: fontFamilies.serif,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: lh(16, 1.4),
    letterSpacing: -0.2,
  },
  caption: { fontFamily: fontFamilies.sans, fontSize: 13, fontWeight: '400', lineHeight: lh(13, 1.3) },
  label: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: lh(11, 1),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: lh(12, 1),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
} as const

const light = {
  colors: {
    background: '#f5f1ec',
    surface: '#ffffff',
    text: '#1a1814',
    textSecondary: '#7a766e',
    textTertiary: '#b5b0a6',
    accent: '#c96442',
    accentDim: '#e7dccf',
    accentSubtle: '#f4dccf',
    border: 'rgba(26,24,20,0.10)',
  },
  shadows: {
    card: { boxShadow: '0 1px 2px rgba(26,24,20,0.04), 0 8px 32px rgba(26,24,20,0.08)' },
  },
  fonts: fontFamilies,
  pastelOf: pastelOfFrom(pastelsLight),
  spacing,
  typography,
  radii,
} as const

type Theme = GeneralizeConst<typeof light>

const dark = {
  colors: {
    background: '#1c1d20',
    surface: '#252629',
    text: '#ece8e2',
    textSecondary: '#9a958c',
    textTertiary: '#5d594f',
    accent: '#e3a37a',
    accentDim: '#3a342d',
    accentSubtle: '#2b2723',
    border: 'rgba(236,232,226,0.10)',
  },
  shadows: {
    card: { boxShadow: '0 1px 2px rgba(0,0,0,0.25), 0 12px 36px rgba(0,0,0,0.4)' },
  },
  fonts: fontFamilies,
  pastelOf: pastelOfFrom(pastelsDark),
  spacing,
  typography,
  radii,
} as const satisfies Theme

type AppThemes = {
  light: typeof light,
  dark: typeof dark,
}

declare module 'react-native-unistyles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/consistent-type-definitions
  interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: { light, dark },
  settings: { adaptiveThemes: true },
})
