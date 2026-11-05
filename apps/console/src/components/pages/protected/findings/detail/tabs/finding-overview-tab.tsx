'use client'

import React from 'react'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { type TPersistOptions, usePersistFormField } from '@/components/shared/crud-base/persist-form-field'
import { HtmlOrText } from '@/components/shared/sanitized-html/sanitized-html'
import { type FindingDetailNode } from '@/lib/graphql-hooks/finding'
import ExposureReferences from '../../../exposure/detail/exposure-references'
import { ReadOnlyRichText } from '../../../exposure/detail/read-only-rich-text'
import ExposureScoreCard from '../../../exposure/detail/score/exposure-score-card'
import DescriptionField from '../../create/form/fields/description-field'
import { isPopulatedObject, TargetDetailsCard } from '../../create/form/fields/additional-fields'
import { type FindingFormData } from '../../hooks/use-form-schema'
import FindingDetailsEditCard from './finding-details-edit-card'

type TFindingOverviewTabProps = {
  finding: FindingDetailNode
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateFindingInput, options?: TPersistOptions) => Promise<void>
}

const OverviewSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="min-w-0 space-y-2">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </section>
)

const FindingOverviewTab: React.FC<TFindingOverviewTabProps> = ({ finding, isEditing, canEdit, handleUpdateField }) => {
  const persistField = usePersistFormField<FindingFormData>()
  const steps = finding.stepsToReproduce?.filter((step) => step.trim()) ?? []
  const targets = [...new Set(finding.targets?.filter((target) => target.trim()) ?? [])]

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

      <ExposureScoreCard
        score={finding.score}
        impact={finding.impact}
        exploitability={finding.exploitability}
        vector={finding.vector}
        source={finding.source}
        canEdit={canEdit && !isEditing}
        onSaveVector={(vector) => persistField('vector', vector, (options) => handleUpdateField({ vector }, options))}
      />

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
          {targets.length > 0 && (
            <OverviewSection title="Targets">
              <ul className="space-y-1 text-sm">
                {targets.map((target) => (
                  <li key={target} className="break-all">
                    {target}
                  </li>
                ))}
              </ul>
            </OverviewSection>
          )}
          {isPopulatedObject(finding.targetDetails) && <TargetDetailsCard value={finding.targetDetails} />}
          <ExposureReferences references={finding.references} />
        </>
      )}
    </div>
  )
}

export default FindingOverviewTab
