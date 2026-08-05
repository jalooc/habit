import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: { alias: { src: resolve(import.meta.dirname, 'src') }},
  // Every date fixture is written in local time, so the suite only means anything in a fixed zone —
  // and the DST tests need one that actually observes a transition, which rules out UTC.
  test: { env: { TZ: 'Europe/Warsaw' }},
})
