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
      WEB_ORIGIN: 'http://127.0.0.1:5173',
      CAMPAIGN_PROVIDER: 'sandbox',
      CAMPAIGN_KEY_ENCRYPTION_SECRET: 'test-campaign-key-secret',
      CAMPAIGN_WEBHOOK_SECRET: 'test-webhook-secret',
    },
  },
})
