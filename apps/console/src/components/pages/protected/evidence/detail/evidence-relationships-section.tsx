'use client'

import React from 'react'
import { Panel, PanelHeader } from '@repo/ui/panel'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import ObjectAssociationControlsChips from '@/components/shared/object-association/object-association-controls-chips'
import AssociatedObjectsAccordion from '@/components/shared/object-association/associated-objects-accordion'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import type { Section } from '@/components/shared/object-association/types/object-association-types'
import ObjectsChip from '@/components/shared/objects-chip/objects-chip'
import { type CreateEvidenceFormMethods } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { type SuggestedControl } from '@/components/pages/protected/evidence/hooks/use-evidence-suggested-controls'
import { type CustomEvidenceControl } from '@/components/pages/protected/evidence/evidence-sheet-config'
import EvidenceLinkedControlsPanel from '@/components/pages/protected/evidence/panels/evidence-linked-controls-panel'
import EvidenceLinkedProgramsPanel from '@/components/pages/protected/evidence/panels/evidence-linked-programs-panel'
import EvidenceDetailSection from './evidence-detail-section'

type TEvidenceRelationshipsSectionProps = {
  form: CreateEvidenceFormMethods
  isEditing: boolean
  evidenceControls: CustomEvidenceControl[] | null
  setEvidenceControls: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
  evidenceSubcontrols: CustomEvidenceControl[] | null
  setEvidenceSubcontrols: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
  suggestedControlsMap?: SuggestedControl[]
  isLoadingSuggestions?: boolean
  associationProgramsRefMap: string[]
  setAssociationProgramsRefMap: React.Dispatch<React.SetStateAction<string[]>>
  initialAssociations: TObjectAssociationMap
  onAssociationsChange: (updatedMap: TObjectAssociationMap) => void
  associatedObjectSections: Section
  programNames: string[]
}

const EvidenceRelationshipsSection: React.FC<TEvidenceRelationshipsSectionProps> = ({
  form,
  isEditing,
  evidenceControls,
  setEvidenceControls,
  evidenceSubcontrols,
  setEvidenceSubcontrols,
  suggestedControlsMap,
  isLoadingSuggestions,
  associationProgramsRefMap,
  setAssociationProgramsRefMap,
  initialAssociations,
  onAssociationsChange,
  associatedObjectSections,
  programNames,
}) => {
  const hasControls = (evidenceControls?.length ?? 0) > 0 || (evidenceSubcontrols?.length ?? 0) > 0
  const hasAssociatedObjects = Object.keys(associatedObjectSections).length > 0

  if (isEditing) {
    return (
      <EvidenceDetailSection title="Relationships">
        <Panel>
          <EvidenceLinkedControlsPanel
            form={form}
            evidenceControls={evidenceControls}
            setEvidenceControls={setEvidenceControls}
            evidenceSubcontrols={evidenceSubcontrols}
            setEvidenceSubcontrols={setEvidenceSubcontrols}
            suggestedControlsMap={suggestedControlsMap}
            isLoadingSuggestions={isLoadingSuggestions}
          />
        </Panel>
        <Panel>
          <EvidenceLinkedProgramsPanel form={form} refMap={associationProgramsRefMap} setRefMap={setAssociationProgramsRefMap} />
        </Panel>
        <Panel>
          <PanelHeader heading="Associate more objects" noBorder />
          <p>Associating objects will allow users with access to the object to see the created evidence.</p>
          <ObjectAssociation
            initialData={initialAssociations}
            onIdChange={onAssociationsChange}
            allowedObjectTypes={[ObjectTypeObjects.CONTROL_IMPLEMENTATION, ObjectTypeObjects.CONTROL_OBJECTIVE, ObjectTypeObjects.SCAN, ObjectTypeObjects.TASK]}
          />
        </Panel>
      </EvidenceDetailSection>
    )
  }

  return (
    <EvidenceDetailSection title="Relationships">
      <div>
        <p className="text-muted-foreground text-xs mb-2">Linked controls</p>
        {hasControls ? (
          <ObjectAssociationControlsChips isEditing={false} evidenceControls={evidenceControls} evidenceSubcontrols={evidenceSubcontrols} />
        ) : (
          <span className="text-sm text-gray-500">no controls linked</span>
        )}
      </div>

      <div>
        <p className="text-muted-foreground text-xs mb-2">Linked programs</p>
        {programNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {programNames.map((name) => (
              <ObjectsChip key={name} name={name} objectType="programs" />
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-500">no programs linked</span>
        )}
      </div>

      {hasAssociatedObjects && (
        <div>
          <p className="text-muted-foreground text-xs mb-2">Other associations</p>
          <AssociatedObjectsAccordion sections={associatedObjectSections} toggleAll={false} />
        </div>
      )}
    </EvidenceDetailSection>
  )
}

export default EvidenceRelationshipsSection
