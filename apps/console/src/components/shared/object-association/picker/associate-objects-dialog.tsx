'use client'

import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { OBJECT_QUERY_CONFIG, ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import ObjectAssociationPlaceholder from '@/components/shared/object-association/object-association-placeholder'
import { type TAssociationUpdateInput, type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { useNotification } from '@/hooks/useNotification'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import AssociationChangesSummary from './association-changes-summary'
import AssociationResults, { EMPTY_ASSOCIATION_VIEW, type TAssociationView } from './association-results'
import { groupAssociationTypes } from './association-type-groups'
import AssociationTypeRail from './association-type-rail'
import { useAssociationChanges } from './use-association-changes'

type TAssociationSave<TFieldKey extends string> = (input: TAssociationUpdateInput<TFieldKey>) => Promise<void>

type TAssociateObjectsBodyProps<TFieldKey extends string> = {
  initialData: TObjectAssociationMap<TFieldKey> | undefined
  allowedObjectTypes: readonly ObjectTypeObjects[]
  defaultSelectedObject?: ObjectTypeObjects
  successMessage: string
  onSave: TAssociationSave<TFieldKey>
  onClose: () => void
  isSaving: boolean
  onSavingChange: (isSaving: boolean) => void
}

type TAssociateObjectsDialogProps<TFieldKey extends string> = Omit<TAssociateObjectsBodyProps<TFieldKey>, 'onClose' | 'isSaving' | 'onSavingChange'> & {
  sourceType: ObjectTypeObjects
  sourceName?: string
  trigger?: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AssociateObjectsBody = <TFieldKey extends string>({
  initialData,
  allowedObjectTypes,
  defaultSelectedObject,
  successMessage,
  onSave,
  onClose,
  isSaving,
  onSavingChange,
}: TAssociateObjectsBodyProps<TFieldKey>) => {
  const { hasObjectType } = useModuleAccess()
  const { errorNotification, successNotification } = useNotification()
  const isSavingRef = useRef(false)
  const [pickedType, setPickedType] = useState(defaultSelectedObject)
  const [views, setViews] = useState<Partial<Record<ObjectTypeObjects, TAssociationView>>>({})
  const [hideLinked, setHideLinked] = useState(false)

  const linked: TObjectAssociationMap = useMemo(() => initialData ?? {}, [initialData])
  const changes = useAssociationChanges(linked)

  const groups = useMemo(() => groupAssociationTypes(allowedObjectTypes.filter((type) => hasObjectType(OBJECT_QUERY_CONFIG[type].objectType))), [allowedObjectTypes, hasObjectType])
  const selectableTypes = groups.flatMap(({ types }) => types)
  const selectedType = selectableTypes.find((type) => type === pickedType) ?? selectableTypes[0] ?? null

  const handleSave = async () => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    onSavingChange(true)
    try {
      await onSave(changes.toInput() as TAssociationUpdateInput<TFieldKey>)
      successNotification({ title: successMessage })
      onClose()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      isSavingRef.current = false
      onSavingChange(false)
    }
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-y sm:flex-row sm:overflow-hidden">
        <AssociationTypeRail groups={groups} selectedType={selectedType} onSelect={setPickedType} getChangeCount={changes.getChangeCount} />
        {selectedType ? (
          <AssociationResults
            key={selectedType}
            objectType={selectedType}
            initialData={linked}
            changes={changes}
            view={views[selectedType] ?? EMPTY_ASSOCIATION_VIEW}
            onViewChange={(view) => setViews((previous) => ({ ...previous, [selectedType]: view }))}
            hideLinked={hideLinked}
            onHideLinkedChange={setHideLinked}
            canSelectSubcontrols={selectableTypes.includes(ObjectTypeObjects.SUB_CONTROL)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-4">
            <ObjectAssociationPlaceholder />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <AssociationChangesSummary changes={changes.changes} undo={changes.undo} reset={changes.reset} />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <SaveButton type="button" onClick={handleSave} disabled={isSaving || !initialData || changes.changes.length === 0} isSaving={isSaving} />
          <CancelButton onClick={onClose} disabled={isSaving} />
        </div>
      </div>
    </>
  )
}

export const AssociateObjectsDialog = <TFieldKey extends string>({ sourceType, sourceName, trigger, open, onOpenChange, ...bodyProps }: TAssociateObjectsDialogProps<TFieldKey>) => {
  const [isSaving, setIsSaving] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!isSaving) onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="flex h-[85vh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 pr-12">
          <DialogTitle>Associate Related Objects</DialogTitle>
          <DialogDescription className="truncate">
            Linking to <span className="text-foreground">{[sourceType, sourceName].filter(Boolean).join(' · ')}</span>
          </DialogDescription>
        </DialogHeader>
        <AssociateObjectsBody {...bodyProps} onClose={() => onOpenChange(false)} isSaving={isSaving} onSavingChange={setIsSaving} />
      </DialogContent>
    </Dialog>
  )
}
