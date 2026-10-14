import { defineConfig } from 'vitest/config'

/** Unit tests run in Node on the pure parts (core, design, tickets/*.ts, testing). No browser, no React. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
