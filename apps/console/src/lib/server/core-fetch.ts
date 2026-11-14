import { openlaneAPIUrl } from '@repo/dally/auth'
import { secureFetch, type SecureFetchOptions } from '@/lib/auth/utils/secure-fetch'
import { clientIpForwardingHeaders } from '@/lib/server/client-ip'

const toOrigin = (url: string | URL | undefined): string | null => (url && URL.canParse(url) ? new URL(url).origin : null)

const CORE_ORIGINS = new Set([openlaneAPIUrl, process.env.API_REST_URL, process.env.NEXT_PUBLIC_API_GQL_URL].map(toOrigin).filter((origin) => origin !== null))

const forwardingHeadersFor = async (url: string | URL): Promise<Record<string, string>> => {
  const origin = toOrigin(url)

  return origin && CORE_ORIGINS.has(origin) ? clientIpForwardingHeaders() : {}
}

export const coreFetch = async (url: string | URL, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers)
  Object.entries(await forwardingHeadersFor(url)).forEach(([name, value]) => headers.set(name, value))

  return fetch(url, { redirect: 'manual', ...init, headers })
}

export const serverSecureFetch = async (url: string | URL, options: RequestInit = {}, secureOptions: Pick<SecureFetchOptions, 'token'> = {}): Promise<Response> =>
  secureFetch(url, { redirect: 'manual', ...options }, { ...secureOptions, forwardedHeaders: await forwardingHeadersFor(url) })
