import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/env.ts'],
    fileParallelism: false,
    hookTimeout: 60000,
    testTimeout: 30000,
    globalTeardown: './src/test/teardown.ts',
    env: {
      AUTH_MODE: 'strict',
      TELEMETRY_SECRET: 'test-secret',
      DEMO_USER_TOKEN: 'dev-token',
      DATABASE_URL: 'postgres://planningpal:planningpal@localhost:5432/planningpal_test',
      BETTER_AUTH_SECRET: 'test-secret-planningpal-auth',
      BETTER_AUTH_URL: 'http://127.0.0.1:3001',
      WEB_ORIGIN: 'http://127.0.0.1:5173',
    },
  },
})
