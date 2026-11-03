import http from 'node:http'
import https from 'node:https'
import { type LookupAddress } from 'node:dns'
import { lookup } from 'node:dns/promises'
import { BlockList, type LookupFunction } from 'node:net'

const PROBE_TIMEOUT_MS = 5_000 // 5s
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const ALLOWED_PORTS = new Set(['', '80', '443'])

const NON_PUBLIC_SUBNETS: ReadonlyArray<[string, number, 'ipv4' | 'ipv6']> = [
  ['0.0.0.0', 8, 'ipv4'],
  ['10.0.0.0', 8, 'ipv4'],
  ['100.64.0.0', 10, 'ipv4'],
  ['127.0.0.0', 8, 'ipv4'],
  ['169.254.0.0', 16, 'ipv4'],
  ['172.16.0.0', 12, 'ipv4'],
  ['192.0.0.0', 24, 'ipv4'],
  ['192.0.2.0', 24, 'ipv4'],
  ['192.88.99.0', 24, 'ipv4'],
  ['192.168.0.0', 16, 'ipv4'],
  ['198.18.0.0', 15, 'ipv4'],
  ['198.51.100.0', 24, 'ipv4'],
  ['203.0.113.0', 24, 'ipv4'],
  ['224.0.0.0', 4, 'ipv4'],
  ['240.0.0.0', 4, 'ipv4'],
  ['::', 128, 'ipv6'],
  ['::1', 128, 'ipv6'],
  ['64:ff9b::', 96, 'ipv6'],
  ['64:ff9b:1::', 48, 'ipv6'],
  ['100::', 64, 'ipv6'],
  ['2001::', 23, 'ipv6'],
  ['2001:db8::', 32, 'ipv6'],
  ['2002::', 16, 'ipv6'],
  ['fc00::', 7, 'ipv6'],
  ['fe80::', 10, 'ipv6'],
  ['ff00::', 8, 'ipv6'],
]

const nonPublicAddresses = new BlockList()
NON_PUBLIC_SUBNETS.forEach(([network, prefix, type]) => nonPublicAddresses.addSubnet(network, prefix, type))

const isPublicAddress = ({ address, family }: LookupAddress) => !nonPublicAddresses.check(address, family === 6 ? 'ipv6' : 'ipv4')

const parseProbeUrl = (value: string) => {
  try {
    const url = new URL(value)
    return ALLOWED_PROTOCOLS.has(url.protocol) && ALLOWED_PORTS.has(url.port) && !url.username && !url.password ? url : null
  } catch {
    return null
  }
}

const resolvePublicAddresses = async (hostname: string) => {
  try {
    const addresses = await lookup(hostname.replace(/^\[|\]$/g, ''), { all: true, verbatim: true })
    return addresses.length > 0 && addresses.every(isPublicAddress) ? addresses : null
  } catch {
    return null
  }
}

const pinnedLookup =
  (addresses: LookupAddress[]): LookupFunction =>
  (_hostname, options, callback) => {
    if (options.all) {
      callback(null, addresses)
      return
    }
    const [first] = addresses
    callback(null, first.address, first.family)
  }

const respondsWithoutError = (url: URL, addresses: LookupAddress[]) =>
  new Promise<boolean>((resolve) => {
    const client = url.protocol === 'https:' ? https : http
    const request = client.request(url, { method: 'GET', lookup: pinnedLookup(addresses), signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) }, (response) => {
      const status = response.statusCode ?? 0
      response.destroy()
      resolve(status >= 200 && status < 400)
    })
    request.on('error', () => resolve(false))
    request.end()
  })

export type TPublicUrlProbeResult = { allowed: false } | { allowed: true; exists: boolean }

export const probePublicUrl = async (value: string): Promise<TPublicUrlProbeResult> => {
  const url = parseProbeUrl(value)
  if (!url) return { allowed: false }

  const addresses = await resolvePublicAddresses(url.hostname)
  if (!addresses) return { allowed: false }

  return { allowed: true, exists: await respondsWithoutError(url, addresses) }
}
