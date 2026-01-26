'use client'

import React, { useState } from 'react'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'
import { InfoIcon, TriangleAlert } from 'lucide-react'
import { CustomEvidenceControl } from '@/components/pages/protected/evidence/evidence-sheet-config'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useCloneControls } from '@/lib/graphql-hooks/standards'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { GetExistingControlsForOrganizationQuery, GetExistingSubcontrolsForOrganizationQuery } from '@repo/codegen/src/schema'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_EXISTING_CONTROLS_FOR_ORGANIZATION } from '@repo/codegen/query/control'
import { GET_EXISTING_SUBCONTROLS_FOR_ORGANIZATION } from '@repo/codegen/query/subcontrol'
import { SystemTooltip } from '@repo/ui/system-tooltip'

type TObjectAssociationControlsChipsProps = {
  form?: UseFormReturn<CreateEvidenceFormData>
  suggestedControlsMap?: { id: string; refCode: string; referenceFramework: string | null; source: string; typeName: 'Control' | 'Subcontrol' }[]
  evidenceControls: CustomEvidenceControl[] | null
  setEvidenceControls?: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
  evidenceSubcontrols: CustomEvidenceControl[] | null
  setEvidenceSubcontrols?: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
  isEditing?: boolean
}

enum ItemType {
  Control = 'Control',
  Subcontrol = 'Subcontrol',
}

const ObjectAssociationControlsChips = ({
  form,
  suggestedControlsMap,
  evidenceControls,
  setEvidenceControls,
  evidenceSubcontrols,
  setEvidenceSubcontrols,
  isEditing = true,
}: TObjectAssociationControlsChipsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedControls, setSelectedControls] = useState<{ id: string; refCode: string; referenceFramework?: string; typeName: ItemType }[]>([])
  const [pendingAdd, setPendingAdd] = useState<{
    id: string
    isSubcontrol: boolean
    refCode: string
    referenceFramework: string | null
  } | null>(null)

  const { mutateAsync: cloneControls } = useCloneControls()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()
  const { client } = useGraphQLClient()

  const handleRemove = (id: string, refCode: string, isSubcontrol = false) => {
    if (isSubcontrol) {
      setEvidenceSubcontrols?.((prev) => {
        const newSubcontrols = prev?.filter((subcontrol) => subcontrol.refCode !== refCode) ?? null
        form?.setValue('subcontrolIDs', newSubcontrols?.map((c) => c.id) ?? [])
        return newSubcontrols
      })
    } else {
      setEvidenceControls?.((prev) => {
        const newControls = prev?.filter((control) => control.refCode !== refCode) ?? null
        form?.setValue('controlIDs', newControls?.map((c) => c.id) ?? [])
        return newControls
      })
    }
  }

  const addEvidenceControl = (id: string, isSubcontrol: boolean, refCode: string, referenceFramework: string | null) => {
    if (isSubcontrol) {
      setEvidenceSubcontrols?.((prev) => {
        const updatedSubcontrols = [...(prev ?? []), { __typename: ItemType.Subcontrol, id, referenceFramework, refCode }]
        const currentIds = form?.getValues('subcontrolIDs') ?? []
        const updatedIds = currentIds.includes(id) ? currentIds : [...currentIds, id]
        form?.setValue('subcontrolIDs', updatedIds, { shouldValidate: true, shouldDirty: true })
        return updatedSubcontrols
      })
    } else {
      setEvidenceControls?.((prev) => {
        const updatedControls = [...(prev ?? []), { __typename: ItemType.Control, id, referenceFramework, refCode }]
        const currentIds = form?.getValues('controlIDs') ?? []
        const updatedIds = currentIds.includes(id) ? currentIds : [...currentIds, id]
        form?.setValue('controlIDs', updatedIds, { shouldValidate: true, shouldDirty: true })
        return updatedControls
      })
    }
  }

  const handleAdd = async (id: string, isSubcontrol = false, refCode: string, source: string, referenceFramework: string | null) => {
    try {
      if (source !== 'SUGGESTED') {
        addEvidenceControl(id, isSubcontrol, refCode, referenceFramework)
        return
      }

      if (isSubcontrol) {
        const response = await client.request<GetExistingSubcontrolsForOrganizationQuery>(GET_EXISTING_SUBCONTROLS_FOR_ORGANIZATION, {
          where: {
            refCodeIn: [refCode],
            systemOwned: false,
            referenceFrameworkIn: [referenceFramework || 'CUSTOM'],
          },
        })

        const exists = response?.subcontrols?.edges?.[0]?.node

        if (exists) {
          addEvidenceControl(exists.id, true, refCode, referenceFramework)
        } else {
          setPendingAdd({ id, isSubcontrol, refCode, referenceFramework })
          setSelectedControls([
            {
              id,
              refCode,
              referenceFramework: referenceFramework ?? '',
              typeName: ItemType.Subcontrol,
            },
          ])
          setIsDialogOpen(true)
        }

        return
      }

      const response = await client.request<GetExistingControlsForOrganizationQuery>(GET_EXISTING_CONTROLS_FOR_ORGANIZATION, {
        where: {
          refCodeIn: [refCode],
          systemOwned: false,
          referenceFrameworkIn: [referenceFramework || 'CUSTOM'],
        },
      })

      const exists = response?.controls.edges?.[0]?.node

      if (exists) {
        addEvidenceControl(exists.id, false, refCode, referenceFramework)
      } else {
        setPendingAdd({ id, isSubcontrol, refCode, referenceFramework })
        setSelectedControls([
          {
            id,
            refCode,
            referenceFramework: referenceFramework ?? '',
            typeName: ItemType.Control,
          },
        ])
        setIsDialogOpen(true)
      }
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleConfirmAdd = async () => {
    if (!pendingAdd) return

    const { id, isSubcontrol, refCode, referenceFramework } = pendingAdd

    try {
      const resp = await cloneControls({
        input: {
          programID: undefined,
          controlIDs: [id],
        },
      })

      const controlId = resp.createControlsByClone.controls?.[0].id
      if (controlId) {
        addEvidenceControl(controlId, isSubcontrol, refCode, referenceFramework)
      }

      queryClient.invalidateQueries({ queryKey: ['controls'] })
      queryClient.invalidateQueries({ queryKey: ['subcontrols'] })

      successNotification({ title: `${isSubcontrol ? 'Subcontrol' : 'Control'} added to organization successfully!` })
      setIsDialogOpen(false)
      setPendingAdd(null)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const viewNode = (
    <div className="flex flex-wrap gap-2">
      {evidenceControls &&
        evidenceControls.map(({ id, refCode, referenceFramework }) => (
          <ControlChip
            key={id}
            clickable={false}
            control={{
              id,
              refCode: refCode,
              referenceFramework: referenceFramework,
              __typename: 'Control',
            }}
          />
        ))}
      {evidenceSubcontrols &&
        evidenceSubcontrols.map(({ id, refCode, referenceFramework }) => (
          <ControlChip
            key={id}
            clickable={false}
            control={{
              id,
              refCode: refCode,
              referenceFramework: referenceFramework,
              __typename: 'Subcontrol',
            }}
          />
        ))}
    </div>
  )

  return isEditing ? (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {evidenceControls &&
          evidenceControls.map(({ id, refCode, referenceFramework }) => (
            <ControlChip
              key={id}
              clickable={false}
              control={{
                id,
                refCode: refCode,
                referenceFramework: referenceFramework,
                __typename: 'Control',
              }}
              removable
              onRemove={() => handleRemove(id, refCode)}
            />
          ))}

        {evidenceSubcontrols &&
          evidenceSubcontrols.map(({ id, refCode, referenceFramework }) => (
            <ControlChip
              key={id}
              clickable={false}
              control={{
                id,
                refCode: refCode,
                referenceFramework: referenceFramework,
                __typename: 'Subcontrol',
              }}
              removable
              onRemove={() => handleRemove(id, refCode, true)}
            />
          ))}
        {((form && form.getValues('controlIDs')) || []).length === 0 && ((form && form.getValues('subcontrolIDs')) || []).length === 0 && (
          <div className="flex gap-2 items-center text-sm leading-5 font-sans font-normal">
            <TriangleAlert height={12} width={12} />
            You haven&apos;t linked any controls to this evidence, ensure at least one control is linked for proper tracking of evidence
          </div>
        )}
      </div>
      {suggestedControlsMap && suggestedControlsMap.length > 0 && (
        <>
          <div className="w-full my-2 border-t border border-logo-bg " />
          <div className="flex gap-2 items-center">
            <div className="text-base font-medium py-2">Suggested</div>
            <SystemTooltip
              icon={<InfoIcon size={14} />}
              content={<p>Suggested controls are identified based on mapped relationships where shared evidence could demonstrate compliance across multiple controls</p>}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedControlsMap
              .filter((c) => {
                const inControls = evidenceControls?.some((item) => item.refCode === c.refCode && item.referenceFramework === c.referenceFramework)
                const inSubcontrols = evidenceSubcontrols?.some((item) => item.refCode === c.refCode && item.referenceFramework === c.referenceFramework)
                return !inControls && !inSubcontrols
              })
              .map(({ id, refCode, referenceFramework, typeName, source }) => (
                <ControlChip
                  key={id}
                  clickable={false}
                  control={{
                    id,
                    refCode,
                    referenceFramework,
                    __typename: typeName,
                  }}
                  canAdd
                  onAdd={() => handleAdd(id, typeName === ItemType.Subcontrol, refCode, source, referenceFramework)}
                />
              ))}
          </div>
        </>
      )}
      <ConfirmationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleConfirmAdd}
        title={`Clone ${selectedControls[0]?.refCode}?`}
        description={
          <>
            This {selectedControls[0]?.typeName === ItemType.Control ? 'Control' : 'Subcontrol'} (<b>{selectedControls[0]?.refCode}</b>) is not in your organization, would you like to add it now?
          </>
        }
        confirmationText="Add"
        confirmationTextVariant="destructive"
      />
    </div>
  ) : (
    viewNode
  )
}

export default ObjectAssociationControlsChips
