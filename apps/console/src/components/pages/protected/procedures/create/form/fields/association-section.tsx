import { useCallback } from 'react'
import { useGetProcedureAssociationsById, useUpdateProcedure } from '@/lib/graphql-hooks/procedure'
import type { UpdateProcedureInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps } from '@/components/shared/object-association/association-section'
import { PROCEDURE_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { asAssociationsData } from '@/components/shared/object-association/utils'

export const ProcedureAssociationSection = (props: BaseAssociationSectionProps) => {
  const procedureId = props.data?.id
  const { data: associationsData } = useGetProcedureAssociationsById(procedureId || null)
  const { mutateAsync: updateProcedure } = useUpdateProcedure()

  const handleUpdateProcedure = useCallback(
    async (input: Partial<UpdateProcedureInput>) => {
      if (!procedureId) return
      await updateProcedure({ updateProcedureId: procedureId, input })
    },
    [updateProcedure, procedureId],
  )

  return <AssociationSection {...props} config={PROCEDURE_ASSOCIATION_CONFIG} associationsData={asAssociationsData(associationsData)} onUpdateEntity={handleUpdateProcedure} />
}
