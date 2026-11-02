const parseHost = (origin: string): string | null => {
  try {
    return new URL(origin).host
  } catch {
    return null
  }
}

export const isCrossSiteRequest = (request: Request): boolean => {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite) {
    return fetchSite !== 'same-origin'
  }

  const origin = request.headers.get('origin')
  if (!origin) {
    return false
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim()
  const requestHost = forwardedHost || request.headers.get('host') || new URL(request.url).host
  return parseHost(origin) !== requestHost
}

export const withSameOriginGuard =
  <TRequest extends Request>(handler: (request: TRequest) => Promise<Response>) =>
  async (request: TRequest): Promise<Response> =>
    isCrossSiteRequest(request) ? Response.json({ error: 'Cross-site request rejected' }, { status: 403 }) : handler(request)
