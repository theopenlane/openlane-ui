import { expect, type Page } from '@playwright/test'

import { coreHeaders, type ApiSession } from './api'
import { updateOrgSettings, type OrgAuthSettings } from './auth-scenarios'
import { API_BASE } from './constants'
import type { MockOidcProvider } from './mock-oidc'

export interface SsoOptions {
  enforced?: boolean
  settings?: OrgAuthSettings
}

const lastCookiePerName = (setCookies: string[]): string[] => {
  const jar = new Map<string, string>()
  for (const cookie of setCookies) {
    const pair = cookie.split(';')[0]
    const separator = pair.indexOf('=')
    if (pair.slice(separator + 1)) jar.set(pair.slice(0, separator), pair)
    else jar.delete(pair.slice(0, separator))
  }
  return [...jar.values()]
}

const postToCore = (path: string, body: object, cookies: string[] = []): Promise<Response> =>
  fetch(`${API_BASE}${path}`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/json', ...coreHeaders(undefined, cookies) },
    body: JSON.stringify(body),
  })

const completeTestSignIn = async (orgId: string, idp: MockOidcProvider, ownerEmail: string): Promise<void> => {
  const start = await postToCore('/v1/sso/login', { organization_id: orgId, is_test: true })
  if (!start.ok) throw new Error(`sso test start failed: ${start.status} ${await start.text()}`)
  const started: { redirect_uri?: string } = await start.json()
  if (!started.redirect_uri) throw new Error(`sso test start returned no redirect_uri: ${JSON.stringify(started)}`)

  const authorize = new URL(started.redirect_uri).searchParams
  const approval = await fetch(`${idp.issuer}/authorize`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: authorize.get('client_id') ?? '',
      redirect_uri: authorize.get('redirect_uri') ?? '',
      state: authorize.get('state') ?? '',
      nonce: authorize.get('nonce') ?? '',
      email: ownerEmail,
    }),
  })
  const location = approval.headers.get('location')
  if (approval.status !== 302 || !location) throw new Error(`mock IdP refused the test sign-in: ${approval.status} ${await approval.text()}`)
  const callback = new URL(location).searchParams

  const finish = await postToCore('/v1/sso/callback', { code: callback.get('code'), state: callback.get('state'), organization_id: orgId }, lastCookiePerName(start.headers.getSetCookie()))
  if (!finish.ok) throw new Error(`sso test callback failed: ${finish.status} ${await finish.text()}`)
}

export const configureOrgSso = async (owner: ApiSession, ownerEmail: string, orgId: string, idp: MockOidcProvider, { enforced = false, settings = {} }: SsoOptions = {}): Promise<void> => {
  await updateOrgSettings(owner, orgId, {
    identityProvider: 'GENERIC_OIDC',
    identityProviderClientID: idp.clientId,
    identityProviderClientSecret: idp.clientSecret,
    oidcDiscoveryEndpoint: idp.discoveryUrl,
    ...settings,
  })
  if (!enforced) return

  await completeTestSignIn(orgId, idp, ownerEmail)
  await updateOrgSettings(owner, orgId, { identityProviderLoginEnforced: true })
}

export const signInAtIdp = async (page: Page, email: string): Promise<void> => {
  await expect(page.getByRole('heading', { name: 'Mock identity provider' })).toBeVisible({ timeout: 30_000 }) // 30s
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Sign in' }).click()
}
