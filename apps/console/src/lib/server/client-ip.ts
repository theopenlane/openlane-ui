import { headers } from 'next/headers'

const CF_CONNECTING_IP_HEADER = 'cf-connecting-ip'
const CLOUDFLARE_INGRESS_SECRET_HEADER = 'x-openlane-ingress-secret'
const FORWARDED_CLIENT_IP_HEADER = 'X-Openlane-Client-IP'
const FORWARDER_SECRET_HEADER = 'X-Openlane-Forwarder-Secret'

const readClientIp = (requestHeaders: Headers): string | null => requestHeaders.get(CF_CONNECTING_IP_HEADER)?.trim() || null

const readSecret = (value: string | undefined): string | null => value?.trim() || null

const constantTimeEquals = (presented: string, expected: string): boolean => {
  if (presented.length !== expected.length) {
    return false
  }

  let difference = 0
  for (let index = 0; index < expected.length; index++) {
    difference |= presented.charCodeAt(index) ^ expected.charCodeAt(index)
  }

  return difference === 0
}

const isCloudflareIngress = (requestHeaders: Headers, ingressSecret: string): boolean => constantTimeEquals(requestHeaders.get(CLOUDFLARE_INGRESS_SECRET_HEADER) ?? '', ingressSecret)

export const getClientIp = (req: Request): string => readClientIp(req.headers) || 'unknown'

export const clientIpForwardingHeaders = async (): Promise<Record<string, string>> => {
  const forwarderSecret = readSecret(process.env.API_FORWARDER_SECRET)
  const ingressSecret = readSecret(process.env.CLOUDFLARE_INGRESS_SECRET)
  if (!forwarderSecret || !ingressSecret) {
    return {}
  }

  const requestHeaders = await headers()
  const clientIp = readClientIp(requestHeaders)
  if (!clientIp || !isCloudflareIngress(requestHeaders, ingressSecret)) {
    return {}
  }

  return { [FORWARDED_CLIENT_IP_HEADER]: clientIp, [FORWARDER_SECRET_HEADER]: forwarderSecret }
}
