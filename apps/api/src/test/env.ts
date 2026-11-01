process.env.AUTH_MODE = 'strict'
process.env.TELEMETRY_SECRET = 'test-secret'
process.env.DEMO_USER_TOKEN = 'dev-token'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://planningpal:planningpal@localhost:5432/planningpal_test'
