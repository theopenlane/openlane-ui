import { type SystemDetailQuery, type UpdateSystemDetailInput } from '@repo/codegen/src/schema'
import { getEdgeIds } from '@/components/shared/object-association/utils'
import { plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import { associationsInput, dateOrClear, orClear, richTextOrClear, type TFieldMappers, passthrough } from '@/hooks/useDirtyInput'
import { type SystemDetailFormData } from './use-form-schema'

export const normalizeSystemDetail = (data: SystemDetailQuery['systemDetail']) => {
  if (!data) {
    return {}
  }

  const normalized = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === null ? undefined : value]))
  const revisionHistory = Array.isArray(data.revisionHistory) ? (data.revisionHistory[0] as string | undefined) : undefined

  return {
    ...normalized,
    revisionHistory,
    platformIDs: getEdgeIds(data.platforms?.edges),
    programIDs: getEdgeIds(data.programs?.edges),
  }
}

export const SYSTEM_DETAIL_UPDATE_FIELDS = {
  description: richTextOrClear('clearDescription'),
  revisionHistory: async (value, _values, { converter }) => {
    const revisionHistory = await plateToHtmlOrNull(value, converter)
    return revisionHistory ? { revisionHistory: [revisionHistory] } : { clearRevisionHistory: true }
  },
  authorizationBoundary: orClear('clearAuthorizationBoundary'),
  sensitivityLevel: orClear('clearSensitivityLevel'),
  lastReviewed: dateOrClear('clearLastReviewed'),
  tags: orClear('clearTags'),
  platformIDs: associationsInput('platformIDs'),
  programIDs: associationsInput('programIDs'),
  systemName: passthrough,
} satisfies TFieldMappers<SystemDetailFormData, UpdateSystemDetailInput>
