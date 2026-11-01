import { sqlClient } from '../db/client.ts'

export async function teardown() {
  await sqlClient.end({ timeout: 5 })
}
