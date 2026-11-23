import { createHash, createSign, generateKeyPairSync, randomBytes, type KeyObject } from 'node:crypto'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'

export interface MockOidcProvider {
  issuer: string
  discoveryUrl: string
  clientId: string
  clientSecret: string
  close: () => Promise<void>
}

interface PendingCode {
  email: string
  name: string
  nonce: string
  redirectUri: string
}

const ID_TOKEN_TTL_SECONDS = 5 * 60 // 5min
const KEY_ID = 'e2e-mock-oidc'

const base64url = (value: Buffer | string): string => Buffer.from(value).toString('base64url')

const signJwt = (privateKey: KeyObject, claims: Record<string, unknown>): string => {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: KEY_ID }))
  const payload = base64url(JSON.stringify(claims))
  const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(privateKey)
  return `${header}.${payload}.${base64url(signature)}`
}

const readBody = (req: IncomingMessage): Promise<URLSearchParams> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(new URLSearchParams(Buffer.concat(chunks).toString())))
    req.on('error', reject)
  })

const sendJson = (res: ServerResponse, status: number, body: object): void => {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)

const signInPage = (params: URLSearchParams): string => {
  const hidden = ['client_id', 'redirect_uri', 'state', 'nonce'].map((key) => `<input type="hidden" name="${key}" value="${escapeHtml(params.get(key) ?? '')}">`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>Mock identity provider</title></head><body>
<main><h1>Mock identity provider</h1>
<form method="post" action="/authorize">${hidden}
<label>Email <input name="email" type="email" required></label>
<label>Name <input name="name" value="E2E SSO User"></label>
<button type="submit">Sign in</button>
</form></main></body></html>`
}

const clientCredentials = (req: IncomingMessage, form: URLSearchParams): { id: string | null; secret: string | null } => {
  const header = req.headers.authorization
  if (header?.startsWith('Basic ')) {
    const [id, secret] = Buffer.from(header.slice(6), 'base64').toString().split(':').map(decodeURIComponent)
    return { id, secret }
  }
  return { id: form.get('client_id'), secret: form.get('client_secret') }
}

export const startMockOidcProvider = async (): Promise<MockOidcProvider> => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: KEY_ID, use: 'sig', alg: 'RS256' }
  const clientId = `e2e-client-${randomBytes(4).toString('hex')}`
  const clientSecret = randomBytes(16).toString('hex')
  const codes = new Map<string, PendingCode>()
  const userinfo = new Map<string, { email: string; name: string; sub: string }>()

  let issuer = ''

  const handle = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', issuer)

    if (req.method === 'GET' && url.pathname === '/.well-known/openid-configuration') {
      return sendJson(res, 200, {
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        userinfo_endpoint: `${issuer}/userinfo`,
        jwks_uri: `${issuer}/jwks`,
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        scopes_supported: ['openid', 'profile', 'email'],
        token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
        claims_supported: ['sub', 'email', 'email_verified', 'name'],
      })
    }

    if (req.method === 'GET' && url.pathname === '/jwks') {
      return sendJson(res, 200, { keys: [jwk] })
    }

    if (req.method === 'GET' && url.pathname === '/authorize') {
      if (url.searchParams.get('client_id') !== clientId) return sendJson(res, 400, { error: 'unauthorized_client' })
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(signInPage(url.searchParams))
      return
    }

    if (req.method === 'POST' && url.pathname === '/authorize') {
      const form = await readBody(req)
      const redirectUri = form.get('redirect_uri') ?? ''
      const email = (form.get('email') ?? '').trim().toLowerCase()
      if (form.get('client_id') !== clientId || !redirectUri || !email) return sendJson(res, 400, { error: 'invalid_request' })

      const code = randomBytes(16).toString('hex')
      codes.set(code, { email, name: form.get('name') || email, nonce: form.get('nonce') ?? '', redirectUri })

      const target = new URL(redirectUri)
      target.searchParams.set('code', code)
      target.searchParams.set('state', form.get('state') ?? '')
      res.writeHead(302, { location: target.toString() })
      res.end()
      return
    }

    if (req.method === 'POST' && url.pathname === '/token') {
      const form = await readBody(req)
      const client = clientCredentials(req, form)
      if (client.id !== clientId || client.secret !== clientSecret) return sendJson(res, 401, { error: 'invalid_client' })

      const pending = codes.get(form.get('code') ?? '')
      codes.delete(form.get('code') ?? '')
      if (!pending || form.get('grant_type') !== 'authorization_code' || form.get('redirect_uri') !== pending.redirectUri) {
        return sendJson(res, 400, { error: 'invalid_grant' })
      }

      const now = Math.floor(Date.now() / 1000)
      const sub = createHash('sha256').update(pending.email).digest('hex').slice(0, 24)
      const accessToken = randomBytes(16).toString('hex')
      userinfo.set(accessToken, { email: pending.email, name: pending.name, sub })

      return sendJson(res, 200, {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: ID_TOKEN_TTL_SECONDS,
        id_token: signJwt(privateKey, {
          iss: issuer,
          sub,
          aud: clientId,
          iat: now,
          exp: now + ID_TOKEN_TTL_SECONDS,
          nonce: pending.nonce,
          email: pending.email,
          email_verified: true,
          name: pending.name,
        }),
      })
    }

    if (req.method === 'GET' && url.pathname === '/userinfo') {
      const info = userinfo.get((req.headers.authorization ?? '').replace(/^Bearer /, ''))
      if (!info) return sendJson(res, 401, { error: 'invalid_token' })
      return sendJson(res, 200, { ...info, email_verified: true })
    }

    sendJson(res, 404, { error: 'not_found' })
  }

  const server: Server = createServer((req, res) => {
    handle(req, res).catch((err) => {
      if (res.headersSent) res.destroy()
      else sendJson(res, 500, { error: String(err) })
    })
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('mock OIDC provider did not bind a TCP port')
  issuer = `http://127.0.0.1:${address.port}`

  return {
    issuer,
    discoveryUrl: `${issuer}/.well-known/openid-configuration`,
    clientId,
    clientSecret,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections()
        server.close(() => resolve())
      }),
  }
}
