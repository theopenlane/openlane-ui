'use client'

import React from 'react'
import type { GetRiskAssociationsQuery, GetRiskByIdQuery } from '@repo/codegen/src/schema'
import MitigationField from '../../../fields/mitigation-field'
import ActionPlansTable from '@/components/pages/protected/action-plans/action-plans-table'

interface MitigationTabProps {
  associations?: GetRiskAssociationsQuery
  isEditing: boolean
  risk?: GetRiskByIdQuery['risk']
  editAllowed?: boolean
}

const MitigationTab: React.FC<MitigationTabProps> = ({ isEditing, risk, editAllowed }) => {
  return (
    <div className="space-y-6">
      <MitigationField isEditing={isEditing} initialValue={risk?.mitigation || ''} isEditAllowed={editAllowed} />
      {risk?.id && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Action Plans</h3>
          <ActionPlansTable additionalWhereFilter={{ hasRisksWith: [{ id: risk.id }] }} createInitialPayload={{ riskIDs: [risk.id] }} hideCreate hideBreadcrumbs />
        </div>
      )}
    </div>
  )
}

export default MitigationTab
