import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageKey } from '@/lib/storage/organization-storage'

export const useOrganizationStorageKey = (key: string): string => {
  const { currentOrgId } = useOrganization()
  return getOrganizationStorageKey(key, currentOrgId)
}
