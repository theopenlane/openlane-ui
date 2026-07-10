import { useMemo } from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { canEdit } from '@/lib/authz/utils'
import { useAccountRolesMany, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useSession } from 'next-auth/react'

type CampaignEdge = { node?: { id: string; entityID?: string | null } | null } | null

type AssessmentWithCampaigns = {
  id: string
  campaigns?: { edges?: Array<CampaignEdge> | null } | null
}

const collectCampaignAndEntityIds = (assessments: AssessmentWithCampaigns[]) => {
  const campaignIds = new Set<string>()
  const entityIds = new Set<string>()
  assessments.forEach((assessment) => {
    assessment.campaigns?.edges?.forEach((edge) => {
      if (edge?.node?.id) campaignIds.add(edge.node.id)
      if (edge?.node?.entityID) entityIds.add(edge.node.entityID)
    })
  })
  return { campaignIds: [...campaignIds], entityIds: [...entityIds] }
}

export const useCanSendQuestionnaire = (campaignIds: string[], entityIds: string[]): boolean => {
  const { data: orgPermission } = useOrganizationRoles()
  const { data: session } = useSession()

  const isAdminOrAbove = canEdit(orgPermission?.roles, session)

  const dedupedCampaignIds = useMemo(() => [...new Set(campaignIds.filter(Boolean))], [campaignIds])
  const dedupedEntityIds = useMemo(() => [...new Set(entityIds.filter(Boolean))], [entityIds])

  const { data: campaignRoles } = useAccountRolesMany({
    objectType: ObjectTypes.CAMPAIGN,
    ids: dedupedCampaignIds,
    enabled: !isAdminOrAbove && dedupedCampaignIds.length > 0,
  })
  const { data: entityRoles } = useAccountRolesMany({
    objectType: ObjectTypes.ENTITY,
    ids: dedupedEntityIds,
    enabled: !isAdminOrAbove && dedupedEntityIds.length > 0,
  })

  return useMemo(() => {
    if (isAdminOrAbove) return true
    const campaignEditable = dedupedCampaignIds.some((id) => canEdit(campaignRoles?.object_roles?.[id], session))
    const entityEditable = dedupedEntityIds.some((id) => canEdit(entityRoles?.object_roles?.[id], session))
    return campaignEditable || entityEditable
  }, [isAdminOrAbove, dedupedCampaignIds, dedupedEntityIds, campaignRoles, entityRoles, session])
}

export const useAssessmentSendPermissionMap = (assessments: AssessmentWithCampaigns[]): Record<string, boolean> => {
  const { data: orgPermission } = useOrganizationRoles()
  const { data: session } = useSession()
  const isAdminOrAbove = canEdit(orgPermission?.roles, session)

  const { campaignIds, entityIds } = useMemo(() => collectCampaignAndEntityIds(assessments), [assessments])

  const { data: campaignRoles } = useAccountRolesMany({
    objectType: ObjectTypes.CAMPAIGN,
    ids: campaignIds,
    enabled: !isAdminOrAbove && campaignIds.length > 0,
  })
  const { data: entityRoles } = useAccountRolesMany({
    objectType: ObjectTypes.ENTITY,
    ids: entityIds,
    enabled: !isAdminOrAbove && entityIds.length > 0,
  })

  return useMemo(() => {
    const map: Record<string, boolean> = {}
    assessments.forEach((assessment) => {
      if (isAdminOrAbove) {
        map[assessment.id] = true
        return
      }
      const edges = assessment.campaigns?.edges ?? []
      const campaignEditable = edges.some((edge) => edge?.node?.id && canEdit(campaignRoles?.object_roles?.[edge.node.id], session))
      const entityEditable = edges.some((edge) => edge?.node?.entityID && canEdit(entityRoles?.object_roles?.[edge.node.entityID], session))
      map[assessment.id] = campaignEditable || entityEditable
    })
    return map
  }, [assessments, isAdminOrAbove, campaignRoles, entityRoles, session])
}
