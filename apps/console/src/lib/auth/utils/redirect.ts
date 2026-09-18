const LOGIN_PATH = '/login'
const TFA_PATH = '/tfa'
const AUTH_PATHS = [LOGIN_PATH, TFA_PATH]
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
  return AUTH_PATHS.some((authPath) => pathname === authPath || pathname.startsWith(`${authPath}/`))
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

const isRootRedirectPath = (path: string) => {
  const parsed = parseRedirectPath(path)

  return !parsed || parsed.pathname === DEFAULT_REDIRECT_PATH
}

const buildAuthRedirect = (basePath: string, redirect?: string | null) => {
  if (!redirect) {
    return basePath
  }

  const sanitized = sanitizeLoginRedirect(redirect)

  if (isRootRedirectPath(sanitized)) {
    return basePath
  }

  return `${basePath}?redirect=${encodeURIComponent(sanitized)}`
}

export const buildLoginRedirect = (redirect?: string | null) => buildAuthRedirect(LOGIN_PATH, redirect)

export const buildTfaRedirect = (redirect?: string | null) => buildAuthRedirect(TFA_PATH, redirect)
