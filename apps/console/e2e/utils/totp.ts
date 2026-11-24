import { createHmac } from 'node:crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const TOTP_PERIOD_MS = 30_000 // 30s
const TOTP_DIGITS = 6
const POLL_INTERVAL_MS = 500

const decodeBase32 = (secret: string): Buffer => {
  const bits = secret
    .toUpperCase()
    .replace(/=+$/, '')
    .split('')
    .map((char) => {
      const index = BASE32_ALPHABET.indexOf(char)
      if (index < 0) throw new Error(`totp: "${char}" is not a base32 character`)
      return index.toString(2).padStart(5, '0')
    })
    .join('')

  const bytes = bits.match(/.{8}/g) ?? []
  return Buffer.from(bytes.map((byte) => parseInt(byte, 2)))
}

export const totpCode = (secret: string, at: number = Date.now()): string => {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(at / TOTP_PERIOD_MS)))

  const digest = createHmac('sha1', decodeBase32(secret)).update(counter).digest()
  const offset = digest[digest.length - 1] & 0x0f
  const binary = digest.readUInt32BE(offset) & 0x7fffffff

  return (binary % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, '0')
}

const MIN_WINDOW_REMAINING_MS = 5_000 // 5s

export const previousWindowTotpCode = async (secret: string): Promise<string> => {
  const remaining = TOTP_PERIOD_MS - (Date.now() % TOTP_PERIOD_MS)
  if (remaining < MIN_WINDOW_REMAINING_MS) await new Promise((resolve) => setTimeout(resolve, remaining))
  return totpCode(secret, Date.now() - TOTP_PERIOD_MS)
}

export const wrongTotpCode = (secret: string): string => ((Number(totpCode(secret)) + 1) % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, '0')

export const unusedTotpCode = async (secret: string, spent: ReadonlySet<string>): Promise<string> => {
  const deadline = Date.now() + 2 * TOTP_PERIOD_MS // 1min
  while (Date.now() < deadline) {
    const code = totpCode(secret)
    if (!spent.has(code)) return code
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  throw new Error('unusedTotpCode: no unspent code within two TOTP windows')
}
