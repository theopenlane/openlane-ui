const ORGANIZATION_SCOPE_SEGMENT = 'organization'

export const getOrganizationStorageKey = (key: string, organizationId?: string): string => `${key}:${ORGANIZATION_SCOPE_SEGMENT}:${organizationId ?? 'unresolved'}`
