'use client'

import React from 'react'
import { type UpdateVulnerabilityInput } from '@repo/codegen/src/schema'
import { type TPersistOptions, usePersistFormField } from '@/components/shared/crud-base/persist-form-field'
import { type VulnerabilityFormData } from '../../../hooks/use-form-schema'
import DescriptionField from '../../../create/form/fields/description-field'
import { type TVulnerabilityDetail } from '../../../vulnerability-display'
import ExposureScoreCard from '../../../../exposure/detail/score/exposure-score-card'
import ExposureReferences from '../../../../exposure/detail/exposure-references'
import { ReadOnlyRichText } from '../../../../exposure/detail/read-only-rich-text'
import VulnerabilityDetailsEditCard from './vulnerability-details-edit-card'

type TOverviewTabProps = {
  vulnerability: TVulnerabilityDetail
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateVulnerabilityInput, options?: TPersistOptions) => Promise<void>
}

const OverviewTab: React.FC<TOverviewTabProps> = ({ vulnerability, isEditing, canEdit, handleUpdateField }) => {
  const persistField = usePersistFormField<VulnerabilityFormData>()

  return (
    <div className="space-y-8">
      {isEditing ? (
        <>
          <DescriptionField key={`${vulnerability.id}-description`} isEditing isCreate={false} initialValue={vulnerability.description ?? ''} />
          <VulnerabilityDetailsEditCard vulnerability={vulnerability} />
        </>
      ) : (
        vulnerability.description && <ReadOnlyRichText value={vulnerability.description} label="Description" />
      )}

      <ExposureScoreCard
        score={vulnerability.score}
        impact={vulnerability.impact}
        exploitability={vulnerability.exploitability}
        vector={vulnerability.vector}
        source={vulnerability.source}
        canEdit={canEdit && !isEditing}
        onSaveVector={(vector) => persistField('vector', vector, (options) => handleUpdateField({ vector }, options))}
      />

      <ExposureReferences references={vulnerability.references} cweIds={vulnerability.cweIds} />
    </div>
  )
}

export default OverviewTab
