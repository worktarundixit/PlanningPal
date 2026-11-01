import { buildApp } from './app.ts'
import { sqlClient } from './db/client.ts'

const app = buildApp()
const port = Number(process.env.API_PORT ?? 3001)
const host = process.env.API_HOST ?? '0.0.0.0'

app
  .listen({ port, host })
  .then((address) => {
    console.log(`PlanningPal API listening on ${address}`)
  })
  .catch(async (error) => {
    app.log.error(error)
    await sqlClient.end()
    process.exit(1)
  })
