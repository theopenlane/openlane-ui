'use client'

import React from 'react'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { type TPersistOptions, usePersistFormField } from '@/components/shared/crud-base/persist-form-field'
import { HtmlOrText } from '@/components/shared/sanitized-html/sanitized-html'
import { type FindingDetailNode } from '@/lib/graphql-hooks/finding'
import ExposureReferences from '../../../exposure/detail/exposure-references'
import { ReadOnlyRichText } from '../../../exposure/detail/read-only-rich-text'
import ExposureScoreCard from '../../../exposure/detail/score/exposure-score-card'
import { hasCvssDetails } from '../../../exposure/detail/score/score-meta'
import DescriptionField from '../../create/form/fields/description-field'
import { type FindingFormData } from '../../hooks/use-form-schema'
import FindingDetailsEditCard from './finding-details-edit-card'
import { FindingTargetsCard } from './finding-targets-card'
import { OverviewSection } from './overview-section'

type TFindingOverviewTabProps = {
  finding: FindingDetailNode
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateFindingInput, options?: TPersistOptions) => Promise<void>
}

const FindingOverviewTab: React.FC<TFindingOverviewTabProps> = ({ finding, isEditing, canEdit, handleUpdateField }) => {
  const persistField = usePersistFormField<FindingFormData>()
  const steps = finding.stepsToReproduce?.filter((step) => step.trim()) ?? []

  return (
    <div className="space-y-8">
      {isEditing ? (
        <>
          <DescriptionField key={`${finding.id}-description`} isEditing isCreate={false} initialValue={finding.description ?? ''} />
          <FindingDetailsEditCard finding={finding} />
        </>
      ) : (
        finding.description && <ReadOnlyRichText value={finding.description} label="Description" />
      )}

      {hasCvssDetails(finding) && (
        <ExposureScoreCard
          score={finding.score}
          impact={finding.impact}
          exploitability={finding.exploitability}
          vector={finding.vector}
          source={finding.source}
          onSaveVector={canEdit && !isEditing ? (vector) => persistField('vector', vector, (options) => handleUpdateField({ vector }, options)) : undefined}
        />
      )}

      {!isEditing && (
        <>
          {finding.recommendedActions && (
            <OverviewSection title="Recommended actions">
              <ReadOnlyRichText value={finding.recommendedActions} label="Recommended actions" />
            </OverviewSection>
          )}
          {steps.length > 0 && (
            <OverviewSection title="Steps to reproduce">
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                {steps.map((step, index) => (
                  <li key={`${index}-${step}`}>
                    <HtmlOrText value={step} />
                  </li>
                ))}
              </ol>
            </OverviewSection>
          )}
          <FindingTargetsCard targets={finding.targets} targetDetails={finding.targetDetails} />
          <ExposureReferences references={finding.references} />
        </>
      )}
    </div>
  )
}

export default FindingOverviewTab
