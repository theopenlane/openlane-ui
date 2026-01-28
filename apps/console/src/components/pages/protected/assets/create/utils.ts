import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { EditAssetFormData } from '../hooks/use-form-schema'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { capitalizeFirstLetter } from '@/lib/auth/utils/strings'
import { Value } from 'platejs'
import { AssetQuery, GetAssetAssociationsQuery } from '@repo/codegen/src/schema'

const generateAssociationPayload = (original: TObjectAssociationMap, updated: TObjectAssociationMap) => {
  const payload: Record<string, string[]> = {}

  const allKeys = new Set([...Object.keys(original), ...Object.keys(updated)])

  allKeys.forEach((key) => {
    const prev = original[key] ?? []
    const next = updated[key] ?? []

    const add = next.filter((id) => !prev.includes(id))
    const remove = prev.filter((id) => !next.includes(id))

    if (add.length > 0) payload[`add${capitalizeFirstLetter(key)}`] = add
    if (remove.length > 0) payload[`remove${capitalizeFirstLetter(key)}`] = remove
  })

  return payload
}

export const buildPayload = async (
  data: EditAssetFormData,
  plateEditorHelper: ReturnType<typeof usePlateEditor>,
  initialAssociations: TObjectAssociationMap,
  updatedAssociations: TObjectAssociationMap,
) => {
  const description = data.description ? await plateEditorHelper.convertToHtml(data?.description as Value) : undefined
  return {
    name: data?.name,
    description,
    tags: data.tags,
    ...generateAssociationPayload(initialAssociations, updatedAssociations),
  }
}

export const generateEvidenceFormData = (data: AssetQuery['asset'] | undefined, associationData: GetAssetAssociationsQuery | undefined) => {
  if (!data) {
    return undefined
  }

  return {
    tags: data!.tags ?? undefined,
    // todo: add these fields later
  }
}

export const buildAssetPayload = async (data: EditAssetFormData, plateEditorHelper: ReturnType<typeof usePlateEditor>) => {
  const description = data?.description ? await plateEditorHelper.convertToHtml(data.description as Value) : undefined
  return {
    name: data?.name,
    description,
  }
}
