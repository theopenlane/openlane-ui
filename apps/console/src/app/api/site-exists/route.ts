import { SiteExistsRequest, SiteExistsResponse } from '@/types/site-exists'
import { NextResponse } from 'next/server'
import net from 'net'
import { lookup } from 'dns/promises'

function isPrivateOrLoopbackIp(ip: string): boolean {
  if (net.isIP(ip) === 0) {
    return false
  }

  if (ip.startsWith('10.')) return true
  if (ip.startsWith('127.')) return true
  const firstOctet172 = ip.startsWith('172.')
  if (firstOctet172) {
    const secondOctet = Number(ip.split('.')[1])
    if (secondOctet >= 16 && secondOctet <= 31) return true
  }
  if (ip.startsWith('192.168.')) return true
  if (ip.startsWith('169.254.')) return true

  if (ip === '::1') return true
  if (ip.toLowerCase().startsWith('fe80:')) return true

  return false
}

async function isSafeUrl(urlString: string): Promise<boolean> {
  let parsed: URL
  try {
    parsed = new URL(urlString)
  } catch {
    return false
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false
  }

  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return false
  }

  try {
    const result = await lookup(parsed.hostname, { all: true })

    if (!result || result.length === 0) {
      return false
    }
    for (const addr of result) {
      if (isPrivateOrLoopbackIp(addr.address)) {
        return false
      }
    }
  } catch {
    return false
  }

  return true
}

async function siteExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'GET' })

    return response.ok
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as SiteExistsRequest
  const isSafe = await isSafeUrl(body.url)

  if (!isSafe) {
    const response: SiteExistsResponse = {
      exists: false,
      error: 'URL not allowed',
    }
    return NextResponse.json(response, { status: 400 })
  }

  if (!body.url) {
    const response: SiteExistsResponse = {
      exists: false,
      error: 'Invalid URL',
    }
    return NextResponse.json(response, { status: 400 })
  }

  const response: SiteExistsResponse = {
    exists: await siteExists(body.url),
  }

  return NextResponse.json(response)
}
