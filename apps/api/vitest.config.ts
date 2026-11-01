import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/env.ts'],
    fileParallelism: false,
    hookTimeout: 60000,
    testTimeout: 30000,
    env: {
      AUTH_MODE: 'strict',
      TELEMETRY_SECRET: 'test-secret',
      DEMO_USER_TOKEN: 'dev-token',
      DATABASE_URL: 'postgres://planningpal:planningpal@localhost:5432/planningpal_test',
    },
  },
})
