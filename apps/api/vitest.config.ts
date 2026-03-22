import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Separate unit and integration test groups so they can be run independently
    include: ['src/__tests__/**/*.test.ts'],
    // Allow env vars to be set in tests (e.g. DATABASE_URL for integration tests)
    setupFiles: ['src/__tests__/setup.ts'],
    // Sane timeout for integration tests hitting a local DB
    testTimeout: 10000,
  },
})
