import { useCallback } from 'react'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { useUpdateFindingWithControlLinks } from '@/components/shared/object-association/finding-control-links'
import { useGetFindingAssociations, useUpdateFinding } from '@/lib/graphql-hooks/finding'

export const useFindingAssociationUpdate = (findingId: string | undefined) => {
  const { data: associationsData } = useGetFindingAssociations(findingId)
  const { mutateAsync: updateFinding } = useUpdateFinding()

  const updateFindingEntity = useCallback(
    async (input: UpdateFindingInput) => {
      if (!findingId) return
      await updateFinding({ updateFindingId: findingId, input })
    },
    [updateFinding, findingId],
  )

  const applyUpdate = useUpdateFindingWithControlLinks({
    findingID: findingId,
    mappingConnection: associationsData?.finding?.controlMappings,
    updateFinding: updateFindingEntity,
  })

  return { associationsData, applyUpdate }
}
