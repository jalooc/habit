import { StyleSheet } from 'react-native-unistyles'

export const pastels = [
  { bg: '#FFF5F5', border: '#F9A8A8' },
  { bg: '#FFF7ED', border: '#F6B07A' },
  { bg: '#FEFCE8', border: '#E5D456' },
  { bg: '#F0FDF4', border: '#7DDBA3' },
  { bg: '#EFF6FF', border: '#8BB8F5' },
  { bg: '#FAF5FF', border: '#CAAAF5' },
] as const

export const light = {
  colors: {
    background: '#FAF8F5',
    surface: '#FFFFFF',
    text: '#1C1917',
    textSecondary: '#78716C',
    textTertiary: '#A8A29E',
    accent: '#E67E22',
    accentSubtle: '#FEF3E2',
    accentText: '#FFFFFF',
    border: '#E7E5E4',
    disabled: '#D6D3D1',
    disabledText: '#A8A29E',
  },
  pastels,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 48,
  },
  typography: {
    title: { fontSize: 28, fontWeight: '700' },
    heading: { fontSize: 20, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 13, fontWeight: '400' },
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
  },
} as const

type AppThemes = {
  light: typeof light
}

declare module 'react-native-unistyles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: { light },
  settings: { initialTheme: 'light' },
})
