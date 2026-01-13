import React from 'react'
import { QueryClient } from '@tanstack/react-query'
import { Group } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EditableFieldFormData } from '@/components/pages/protected/tasks/hooks/use-editable-field-form-schema'
import EditableGroupCell from '@/components/shared/editable-group-cell/editable-group-cell'
import { useUpdateRisk } from '@/lib/graphql-hooks/risks'

type TStakeholderCellProps = {
  stakeholder?: Group | null
  riskId: string
}

const StakeholderCell: React.FC<TStakeholderCellProps> = ({ stakeholder, riskId }) => {
  const { mutateAsync: updateRisk } = useUpdateRisk()

  const handleSubmitData = async (data: EditableFieldFormData, helpers: { queryClient: QueryClient; notifySuccess: () => void; notifyError: (msg: string) => void }) => {
    try {
      await updateRisk({
        updateRiskId: riskId,
        input: {
          stakeholderID: data.id,
          clearStakeholder: !data.id,
        },
      })
      await helpers.queryClient.invalidateQueries({ queryKey: ['risks'] })
      helpers.notifySuccess()
    } catch (err) {
      helpers.notifyError(parseErrorMessage(err))
    }
  }

  return <EditableGroupCell label="Risk" entity={stakeholder} onSubmitData={handleSubmitData} placeholder="No stakeholder" />
}

export default StakeholderCell
