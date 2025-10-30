'use client'

import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useCallback, useEffect, useState } from 'react'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { usePolicy } from '@/components/pages/protected/policies/create/hooks/use-policy.tsx'
import { UpdateInternalPolicyInput } from '@repo/codegen/src/schema.ts'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateInternalPolicy } from '@/lib/graphql-hooks/policy.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import AddAssociationBtn from '@/components/shared/object-association/add-association-btn.tsx'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type TSetObjectAssociationDialogProps = {
  policyId?: string
  fromTable?: boolean // if from table open automatically without trigger
  onClose?: () => void
}

const SetObjectAssociationPoliciesDialog = ({ policyId, fromTable = false, onClose }: TSetObjectAssociationDialogProps) => {
  const policyState = usePolicy()
  const queryClient = useQueryClient()
  const associationsState = usePolicy((state) => state.associations)
  const initialAssociationsState = usePolicy((state) => state.initialAssociations)
  const refCodeAssociationsState = usePolicy((state) => state.associationRefCodes)
  const { successNotification, errorNotification } = useNotification()
  const [associations, setAssociations] = useState<{
    associations: TObjectAssociationMap
    refCodes: TObjectAssociationMap
  }>({
    associations: {},
    refCodes: {},
  })
  const [open, setOpen] = useState(false)
  const { mutateAsync: updatePolicy, isPending: isSaving } = useUpdateInternalPolicy()

  const excludeObjectTypes = fromTable
    ? Object.values(ObjectTypeObjects).filter((type) => type !== ObjectTypeObjects.PROCEDURE)
    : [ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.GROUP, ObjectTypeObjects.RISK, ObjectTypeObjects.INTERNAL_POLICY]

  const handleSave = () => {
    policyState.setAssociations(associations.associations)
    policyState.setAssociationRefCodes(associations.refCodes)
    if (policyId) {
      onSubmitHandler(associations.associations)
    } else {
      setOpen(false)
    }
  }

  function getAssociationDiffs(initial: TObjectAssociationMap, current: TObjectAssociationMap): { added: TObjectAssociationMap; removed: TObjectAssociationMap } {
    const added: TObjectAssociationMap = {}
    const removed: TObjectAssociationMap = {}

    const allKeys = new Set([...Object.keys(initial), ...Object.keys(current)])

    for (const key of allKeys) {
      const initialSet = new Set(initial[key] ?? [])
      const currentSet = new Set(current[key] ?? [])

      const addedItems = [...currentSet].filter((id) => !initialSet.has(id))
      const removedItems = [...initialSet].filter((id) => !currentSet.has(id))

      if (addedItems.length > 0) {
        added[key] = addedItems
      }
      if (removedItems.length > 0) {
        removed[key] = removedItems
      }
    }

    return { added, removed }
  }

  const onSubmitHandler = async (associations: TObjectAssociationMap) => {
    try {
      const { added, removed } = getAssociationDiffs(initialAssociationsState, associations)

      const buildMutationKey = (prefix: string, key: string) => `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`

      const associationInputs = {
        ...Object.entries(added).reduce(
          (acc, [key, ids]) => {
            if (ids && ids.length > 0) {
              acc[buildMutationKey('add', key)] = ids
            }
            return acc
          },
          {} as Record<string, string[]>,
        ),

        ...Object.entries(removed).reduce(
          (acc, [key, ids]) => {
            if (ids && ids.length > 0) {
              acc[buildMutationKey('remove', key)] = ids
            }
            return acc
          },
          {} as Record<string, string[]>,
        ),
      }

      const formData: {
        updateInternalPolicyId: string
        input: UpdateInternalPolicyInput
      } = {
        updateInternalPolicyId: policyId!,
        input: {
          ...associationInputs,
        },
      }

      await updatePolicy(formData)

      successNotification({
        title: 'Policy Updated',
        description: 'Policy has been successfully updated',
      })

      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
      queryClient.invalidateQueries({ queryKey: ['internalPolicy', policyId!] })
      setOpen(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAssociations({
        associations: {},
        refCodes: {},
      })
      onClose?.()
    }
    setOpen(isOpen)
  }

  const handleIdChange = useCallback((updatedMap: TObjectAssociationMap, refCodes: TObjectAssociationMap) => {
    setAssociations({ associations: updatedMap, refCodes })
  }, [])

  useEffect(() => {
    if (!!policyId && !!fromTable) {
      setOpen(true)
    }
  }, [fromTable, policyId])

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      {!fromTable && (
        <DialogTrigger asChild>
          <AddAssociationBtn />
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Set Association</DialogTitle>
        </DialogHeader>
        <ObjectAssociation
          onIdChange={handleIdChange}
          initialData={associationsState}
          refCodeInitialData={refCodeAssociationsState}
          excludeObjectTypes={excludeObjectTypes}
          defaultSelectedObject={fromTable ? ObjectTypeObjects.PROCEDURE : undefined}
        />
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            Save
          </Button>
          <Button variant="secondary" disabled={isSaving} onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SetObjectAssociationPoliciesDialog
