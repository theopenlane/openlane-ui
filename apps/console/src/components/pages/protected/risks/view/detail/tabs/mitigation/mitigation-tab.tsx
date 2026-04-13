'use client'

import React from 'react'
import type { GetRiskAssociationsQuery, GetRiskByIdQuery } from '@repo/codegen/src/schema'
import MitigationField from '../../../fields/mitigation-field'

interface MitigationTabProps {
  associations?: GetRiskAssociationsQuery
  isEditing: boolean
  risk?: GetRiskByIdQuery['risk']
  editAllowed?: boolean
}

const MitigationTab: React.FC<MitigationTabProps> = ({ associations, isEditing, risk, editAllowed }) => {
  const actionPlans = associations?.risk?.actionPlans?.edges?.map((e) => e?.node).filter(Boolean) ?? []

  if (actionPlans.length === 0) {
    return (
      <>
        <MitigationField isEditing={isEditing} initialValue={risk?.mitigation || ''} isEditAllowed={editAllowed} />
        {/* <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No action plans associated with this risk.</p>
          </CardContent>
        </Card> */}
      </>
    )
  }

  return (
    <div className="space-y-3">
      <MitigationField isEditing={isEditing} initialValue={risk?.mitigation || ''} isEditAllowed={editAllowed} />
      {/* {actionPlans.map((actionPlan) => (
        <Card key={actionPlan?.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{actionPlan?.name}</CardTitle>
              {actionPlan?.status && <Badge variant="outline">{actionPlan.status}</Badge>}
            </div>
          </CardHeader>
        </Card>
      ))} */}
    </div>
  )
}

export default MitigationTab
