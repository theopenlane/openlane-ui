'use client'

import React, { useMemo } from 'react'
import { type UpdateVulnerabilityInput } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type TPersistOptions, usePersistFormField } from '@/components/shared/crud-base/persist-form-field'
import { type VulnerabilityFormData } from '../../../hooks/use-form-schema'
import DescriptionField from '../../../create/form/fields/description-field'
import { type TVulnerabilityDetail } from '../../../vulnerability-display'
import VulnerabilityScoreCard from './vulnerability-score-card'
import VulnerabilityReferences from './vulnerability-references'
import VulnerabilityDetailsEditCard from './vulnerability-details-edit-card'

type TOverviewTabProps = {
  vulnerability: TVulnerabilityDetail
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateVulnerabilityInput, options?: TPersistOptions) => Promise<void>
}

const ReadOnlyDescription: React.FC<{ description: string }> = ({ description }) => {
  const { convertToReadOnly } = usePlateEditor()
  const content = useMemo(() => convertToReadOnly(description), [convertToReadOnly, description])

  return (
    <section aria-label="Description" className="min-w-0 whitespace-pre-wrap break-words">
      {content}
    </section>
  )
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
        vulnerability.description && <ReadOnlyDescription description={vulnerability.description} />
      )}

      <VulnerabilityScoreCard
        score={vulnerability.score}
        impact={vulnerability.impact}
        exploitability={vulnerability.exploitability}
        vector={vulnerability.vector}
        source={vulnerability.source}
        canEdit={canEdit && !isEditing}
        onSaveVector={(vector) => persistField('vector', vector, (options) => handleUpdateField({ vector }, options))}
      />

      <VulnerabilityReferences references={vulnerability.references} cweIds={vulnerability.cweIds} />
    </div>
  )
}

export default OverviewTab
