'use client'

import React, { useCallback, useMemo } from 'react'
import { type UpdateAssetInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { SetAssociationDialog, type SetAssociationDialogConfig } from '@/components/shared/object-association/set-association-dialog'
import { type TAssociationUpdateInput } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { useUpdateAsset } from '@/lib/graphql-hooks/asset'
import { useBulkEditRisk } from '@/lib/graphql-hooks/risk'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { type TExposureItem } from './exposure-items'

type TExposureFieldKey = 'vulnerabilityIDs' | 'findingIDs' | 'riskIDs'

const EXPOSURE_OBJECT_TYPES = [
  { option: ObjectTypeObjects.VULNERABILITY, objectType: ObjectTypes.VULNERABILITY },
  { option: ObjectTypeObjects.FINDING, objectType: ObjectTypes.FINDING },
  { option: ObjectTypeObjects.RISK, objectType: ObjectTypes.RISK },
]

const MAX_LINKED_RISKS = 1

const LINK_EXPOSURE_CONFIG: SetAssociationDialogConfig<'asset', 'vulnerabilities' | 'findings' | 'risks', TExposureFieldKey> = {
  dataRootField: 'asset',
  invalidateQueryKey: 'assets',
  successMessage: 'Exposure updated',
  allowedObjectTypes: EXPOSURE_OBJECT_TYPES.map(({ option }) => option),
  initialDataKeys: { vulnerabilityIDs: 'vulnerabilities', findingIDs: 'findings', riskIDs: 'risks' },
}

const toConnection = (items: TExposureItem[], kind: TExposureItem['kind']) => ({ edges: items.filter((item) => item.kind === kind).map(({ id }) => ({ node: { id } })) })

type TLinkExposureDialogProps = {
  assetId: string
  items: TExposureItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const LinkExposureDialog: React.FC<TLinkExposureDialogProps> = ({ assetId, items, open, onOpenChange }) => {
  const { hasObjectType } = useModuleAccess()
  const { mutateAsync: updateAsset } = useUpdateAsset()
  const { mutateAsync: updateRisks } = useBulkEditRisk()

  const associationsData = useMemo(
    () => ({
      asset: {
        vulnerabilities: toConnection(items, ObjectAssociationNodeEnum.VULNERABILITY),
        findings: toConnection(items, ObjectAssociationNodeEnum.FINDING),
        risks: toConnection(items, ObjectAssociationNodeEnum.RISKS),
      },
    }),
    [items],
  )
  const allowedObjectTypes = EXPOSURE_OBJECT_TYPES.filter(({ objectType }) => hasObjectType(objectType)).map(({ option }) => option)

  const handleUpdate = useCallback(
    async ({ addRiskIDs, removeRiskIDs, ...assetEdges }: TAssociationUpdateInput<TExposureFieldKey>) => {
      const linkedRiskCount = items.filter(({ kind }) => kind === ObjectAssociationNodeEnum.RISKS).length
      if (addRiskIDs?.length && linkedRiskCount - (removeRiskIDs?.length ?? 0) + addRiskIDs.length > MAX_LINKED_RISKS) {
        throw new UserFacingError('An asset can be linked to one risk. Remove the current risk or select only one.')
      }
      const assetInput: UpdateAssetInput = assetEdges
      if (Object.keys(assetInput).length > 0) await updateAsset({ updateAssetId: assetId, input: assetInput })
      const riskUpdates = [
        { ids: removeRiskIDs, input: { removeAssetIDs: [assetId] } },
        { ids: addRiskIDs, input: { addAssetIDs: [assetId] } },
      ]
      for (const { ids, input } of riskUpdates) {
        if (!ids?.length) continue
        const { updateBulkRisk } = await updateRisks({ ids, input })
        if (updateBulkRisk.notUpdatedIDs?.length) throw new UserFacingError('Some risks could not be updated. You may not have permission to edit them.')
      }
    },
    [assetId, items, updateAsset, updateRisks],
  )

  return (
    <SetAssociationDialog
      config={LINK_EXPOSURE_CONFIG}
      associationsData={associationsData}
      onUpdate={handleUpdate}
      defaultSelectedObject={allowedObjectTypes[0]}
      allowedObjectTypes={allowedObjectTypes}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
