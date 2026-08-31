export interface SSORequirement {
  organizationId: string
  ssoLoginPath?: string
}

export interface SSOUnauthorizedBody {
  sso_required?: boolean
  organization_id?: string
  sso_login_path?: string
}

const SSO_LOGIN_PATH_PATTERN = /^\/v1\/sso\/[a-zA-Z0-9\-_/]+$/

export const isSSOLoginPath = (value: string): boolean => SSO_LOGIN_PATH_PATTERN.test(value)

export const parseSSORequirement = (body: SSOUnauthorizedBody | null): SSORequirement | null => {
  if (body?.sso_required !== true || typeof body.organization_id !== 'string' || body.organization_id === '') {
    return null
  }

  const ssoLoginPath = body.sso_login_path && isSSOLoginPath(body.sso_login_path) ? body.sso_login_path : undefined

  return { organizationId: body.organization_id, ssoLoginPath }
}

export const readSSORequirement = async (response: Response): Promise<SSORequirement | null> => {
  if (response.status !== 401) {
    return null
  }

  try {
    const body: SSOUnauthorizedBody = await response.clone().json()
    return parseSSORequirement(body)
  } catch {
    return null
  }
}
