import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

function keyFor(secret: string) {
  return createHash('sha256').update(secret).digest()
}

/** AES-256-GCM. The browser never receives the ciphertext or the plaintext. */
export function sealSecret(plain: string, secret: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyFor(secret), iv)
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join('.')
}

export function openSecret(payload: string, secret: string) {
  const [iv, tag, ciphertext] = payload.split('.')
  if (!iv || !tag || !ciphertext) throw new Error('Campaign key payload is incomplete')
  const decipher = createDecipheriv('aes-256-gcm', keyFor(secret), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8')
}

export function maskSecret(value: string) {
  const tail = value.replace(/\s/g, '').slice(-4)
  return tail ? `••••${tail}` : '••••'
}
