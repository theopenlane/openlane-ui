'use client'

import React, { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@repo/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTrigger } from '@repo/ui/sheet'

import { SlideoutFormActions } from '@/components/shared/crud-base/slideout-form-actions'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import { TrustServicesCategoryOption } from '@/components/shared/trust-services-categories/trust-services-category-option'
import { normalizeFrameworkName, programFrameworkControlsWhere } from '@/constants/standards'
import { isTrustServicesCategory, SOC_2_REQUIRED_CATEGORY, TRUST_SERVICES_CATEGORIES } from '@/constants/trust-services-categories'
import { invalidateControlQueries, useControlIdFetcher } from '@/lib/graphql-hooks/control'
import { useUpdateProgram } from '@/lib/graphql-hooks/program'
import { useCloneControls } from '@/lib/graphql-hooks/standard'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type TTrustServicesCategoriesSlideoutProps = {
  programId: string
  frameworkName: string
  programCategories: string[]
  disabled?: boolean
}

const TrustServicesCategoriesSlideout = ({ programId, frameworkName, programCategories, disabled }: TTrustServicesCategoriesSlideoutProps) => {
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: cloneControls } = useCloneControls()
  const { mutateAsync: updateProgram } = useUpdateProgram()
  const fetchControlIds = useControlIdFetcher()

  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const currentCategories = useMemo(() => programCategories.filter(isTrustServicesCategory), [programCategories])
  const [selected, setSelected] = useState<string[]>(currentCategories)

  const standardShortName = normalizeFrameworkName(frameworkName)
  const isRequiredCategoryImported = currentCategories.includes(SOC_2_REQUIRED_CATEGORY)

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelected(currentCategories)
    }

    setIsOpen(open)
  }

  const added = selected.filter((category) => !currentCategories.includes(category))
  const removed = currentCategories.filter((category) => !selected.includes(category))
  const hasChanges = added.length > 0 || removed.length > 0

  const toggleCategory = (name: string) => {
    setSelected((previous) => (previous.includes(name) ? previous.filter((category) => category !== name) : [...previous, name]))
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const [cloneResult, controlIDsToRemove] = await Promise.all([
        added.length > 0 ? cloneControls({ input: { programID: programId, standardShortName, categories: added } }) : null,
        removed.length > 0 ? fetchControlIds({ ...programFrameworkControlsWhere(programId, frameworkName), categoryIn: removed }) : [],
      ])

      if (controlIDsToRemove.length > 0) {
        await updateProgram({ updateProgramId: programId, input: { removeControlIDs: controlIDsToRemove } })
      }

      if (cloneResult && !cloneResult.createControlsByClone.controls?.length) {
        errorNotification({
          title: 'No controls imported',
          description: `No ${standardShortName} controls were found for ${added.join(', ')}.`,
        })

        return
      }

      successNotification({
        title: 'Program updated',
        description: 'Trust Services Categories updated successfully.',
      })

      setIsOpen(false)
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: parseErrorMessage(error),
      })
    } finally {
      invalidateControlQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: ['programs', programId] })
      queryClient.invalidateQueries({ queryKey: ['program-evidence-stats', programId] })
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="link" type="button" className="text-[var(--color-info)]" icon={<Plus size={14} />} iconPosition="left" disabled={disabled}>
          Add categories
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        minWidth={360}
        initialWidth={480}
        header={<SlideoutHeader title={`${standardShortName} Trust Services Categories`} onClose={() => setIsOpen(false)} />}
        footer={<SlideoutFormActions onSave={handleSave} onCancel={() => setIsOpen(false)} isPending={isSaving} disabled={!hasChanges} saveLabel="Update program" savingLabel="Updating..." />}
      >
        <SheetDescription>
          Select the Trust Services Categories that apply to this program.{' '}
          {isRequiredCategoryImported
            ? `${SOC_2_REQUIRED_CATEGORY} is required for every ${standardShortName} program and cannot be deselected.`
            : `${SOC_2_REQUIRED_CATEGORY} is required for every ${standardShortName} program — select it to import its controls.`}
        </SheetDescription>

        <div className="mt-6 flex flex-col gap-3">
          {TRUST_SERVICES_CATEGORIES.map((category) => (
            <TrustServicesCategoryOption
              key={category.name}
              category={category}
              checked={selected.includes(category.name)}
              onCheckedChange={() => toggleCategory(category.name)}
              requiredLabel={category.name === SOC_2_REQUIRED_CATEGORY ? 'Required' : undefined}
              locked={category.name === SOC_2_REQUIRED_CATEGORY && isRequiredCategoryImported}
              disabled={isSaving}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default TrustServicesCategoriesSlideout
