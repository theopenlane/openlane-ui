const LOGIN_PATH = '/login'
const DEFAULT_REDIRECT_PATH = '/'

const parseRedirectPath = (redirect: string): { path: string; pathname: string } | null => {
  const trimmedRedirect = redirect.trim()

  if (!trimmedRedirect || !trimmedRedirect.startsWith('/') || trimmedRedirect.startsWith('//')) {
    return null
  }

  try {
    const parsed = new URL(trimmedRedirect, 'https://openlane.local')
    return {
      path: `${parsed.pathname}${parsed.search}${parsed.hash}`,
      pathname: parsed.pathname,
    }
  } catch {
    return null
  }
}

const isBlockedRedirectPath = (pathname: string) => {
  return pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`)
}

export const sanitizeLoginRedirect = (redirect?: string | null, fallback = DEFAULT_REDIRECT_PATH) => {
  if (!redirect) {
    return fallback
  }

  const parsed = parseRedirectPath(redirect)

  if (!parsed || isBlockedRedirectPath(parsed.pathname)) {
    return fallback
  }

  return parsed.path
}

export const buildLoginRedirect = (redirect?: string | null, fallback = DEFAULT_REDIRECT_PATH) => {
  if (!redirect) {
    return LOGIN_PATH
  }

  const sanitized = sanitizeLoginRedirect(redirect, fallback)

  if (sanitized === fallback && redirect !== fallback) {
    return LOGIN_PATH
  }

  return `${LOGIN_PATH}?redirect=${encodeURIComponent(sanitized)}`
}
