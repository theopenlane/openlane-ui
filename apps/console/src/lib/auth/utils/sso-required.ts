export interface SSORequirement {
  organizationId: string
}

export interface SSOUnauthorizedBody {
  sso_required?: boolean
  organization_id?: string
  sso_login_path?: string
}

export const parseSSORequirement = (body: SSOUnauthorizedBody | null): SSORequirement | null => {
  if (body?.sso_required !== true || typeof body.organization_id !== 'string' || body.organization_id === '') {
    return null
  }

  return { organizationId: body.organization_id }
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
