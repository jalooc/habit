import { StyleSheet } from 'react-native-unistyles'

// 20 pastels stepped 12° across the red→blue arc (no violets/pinks) — backgrounds at L=96%/S=85%, borders at L=72%/S=72%
export const pastels = [
  { bg: '#FEECEC', border: '#EB8484' },
  { bg: '#FEF0EC', border: '#EB9984' },
  { bg: '#FEF3EC', border: '#EBAD84' },
  { bg: '#FEF7EC', border: '#EBC284' },
  { bg: '#FEFAEC', border: '#EBD784' },
  { bg: '#FEFEEC', border: '#EBEB84' },
  { bg: '#FAFEEC', border: '#D7EB84' },
  { bg: '#F7FEEC', border: '#C2EB84' },
  { bg: '#F3FEEC', border: '#ADEB84' },
  { bg: '#F0FEEC', border: '#99EB84' },
  { bg: '#ECFEEC', border: '#84EB84' },
  { bg: '#ECFEF0', border: '#84EB99' },
  { bg: '#ECFEF3', border: '#84EBAD' },
  { bg: '#ECFEF7', border: '#84EBC2' },
  { bg: '#ECFEFA', border: '#84EBD7' },
  { bg: '#ECFEFE', border: '#84EBEB' },
  { bg: '#ECFAFE', border: '#84D7EB' },
  { bg: '#ECF7FE', border: '#84C2EB' },
  { bg: '#ECF3FE', border: '#84ADEB' },
  { bg: '#ECF0FE', border: '#8499EB' },
] as const

const hashWithDjb2 = (s: string) =>
  Array.from(s).reduce((h, c) => ((h << 5) + h + c.charCodeAt(0)) | 0, 5381)

export const pastelOf = (id: string) =>
  pastels[Math.abs(hashWithDjb2(id)) % pastels.length]

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
  light: typeof light,
}

declare module 'react-native-unistyles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/consistent-type-definitions
  interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: { light },
  settings: { initialTheme: 'light' },
})
