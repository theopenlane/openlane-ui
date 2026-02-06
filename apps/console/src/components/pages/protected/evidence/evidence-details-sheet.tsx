'use client'

import React, { Fragment, useEffect, useRef, useMemo, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import {
  Binoculars,
  Calendar,
  CalendarCheck2,
  CalendarClock,
  CircuitBoard,
  Download,
  Eye,
  InfoIcon,
  LinkIcon,
  Link,
  Tag,
  Trash2,
  UserRoundCheck,
  UserRoundPen,
  X,
  Copy,
  Pencil,
  ChevronDown,
  Plus,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader } from '@repo/ui/sheet'
import { Input, InputRow } from '@repo/ui/input'
import { useNotification } from '@/hooks/useNotification'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { useControlEvidenceStore } from '@/components/pages/protected/controls/hooks/useControlEvidenceStore.ts'
import { useDeleteEvidence, useGetEvidenceById, useUpdateEvidence } from '@/lib/graphql-hooks/evidence.ts'
import { formatDate } from '@/utils/date.ts'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { Control, EvidenceEvidenceStatus, Subcontrol, User } from '@repo/codegen/src/schema.ts'
import useFormSchema, { EditEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema.ts'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Controller } from 'react-hook-form'
import { EvidenceStatusMapper } from '@/components/pages/protected/evidence/util/evidence.ts'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { useQueryClient } from '@tanstack/react-query'
import { Textarea } from '@repo/ui/textarea'
import { fileDownload } from '@/components/shared/lib/export.ts'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { EvidenceRenewDialog } from '@/components/pages/protected/evidence/evidence-renew-dialog'
import { EvidenceIconMapper, EvidenceStatusOptions } from '@/components/shared/enum-mapper/evidence-enum'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members.ts'
import { Panel, PanelHeader } from '@repo/ui/panel'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association.tsx'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config.ts'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'
import { getAssociationInput } from '@/components/shared/object-association/utils.ts'
import { canEdit } from '@/lib/authz/utils'
import useEscapeKey from '@/hooks/useEscapeKey'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { EvidenceDetailsSheetSkeleton } from './skeleton/evidence-details-skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import NextLink from 'next/link'
import EvidenceFiles from './evidence-files'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { statCardStyles } from '@/components/shared/stats-cards/stats-cards-styles'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ProgramSelectionDialog } from '@/components/shared/objectAssociation/object-association-programs-dialog'
import { ControlSelectionDialog } from '@/components/shared/objectAssociation/object-association-control-dialog'
import ObjectAssociationProgramsChips from '@/components/shared/objectAssociation/object-association-programs-chips'
import ObjectAssociationControlsChips from '@/components/shared/objectAssociation/object-association-controls-chips'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { useGetSuggestedControlsOrSubcontrols } from '@/lib/graphql-hooks/controls'
import { buildWhere, CustomEvidenceControl, flattenAndFilterControls } from './evidence-sheet-config'
import { useGetStandards } from '@/lib/graphql-hooks/standards'
import { useGetTags } from '@/lib/graphql-hooks/tags'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import EvidenceCommentsCard from './evidence-comment-card'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { Value } from 'platejs'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TEvidenceDetailsSheet = {
  controlId?: string
}

type EditableFields = 'name' | 'description' | 'collectionProcedure' | 'source' | 'url' | 'status' | 'creationDate' | 'renewalDate' | 'tags'

const EvidenceDetailsSheet: React.FC<TEvidenceDetailsSheet> = ({ controlId }) => {
  const { convertToHtml, convertToReadOnly } = usePlateEditor()
  const objectAssociationRef = React.useRef<HTMLDivElement | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [tagValues, setTagValues] = useState<Option[]>([])

  const queryClient = useQueryClient()
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false)

  const { isEditPreset, setIsEditPreset } = useControlEvidenceStore()
  const searchParams = useSearchParams()
  const controlEvidenceIdParam = searchParams?.get('controlEvidenceId')
  const id = searchParams.get('id')
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)
  const [associations, setAssociations] = useState<TObjectAssociationMap>({})

  const { mutateAsync: updateEvidence } = useUpdateEvidence()
  const { mutateAsync: deleteEvidence } = useDeleteEvidence()
  const { wrapper, content } = statCardStyles({ color: 'green' })

  const [openControlsDialog, setOpenControlsDialog] = useState(false)

  const [associationProgramsRefMap, setAssociationProgramsRefMap] = useState<string[]>([])
  const [openProgramsDialog, setOpenProgramsDialog] = useState(false)
  const [suggestedControlsMap, setSuggestedControlsMap] = useState<{ id: string; refCode: string; referenceFramework: string | null; source: string; typeName: 'Control' | 'Subcontrol' }[]>([])

  const [evidenceControls, setEvidenceControls] = useState<CustomEvidenceControl[] | null>(null)
  const [evidenceSubcontrols, setEvidenceSubcontrols] = useState<CustomEvidenceControl[] | null>(null)
  const { tagOptions } = useGetTags()

  const config = useMemo(() => {
    if (controlEvidenceIdParam) {
      return { id: controlEvidenceIdParam, link: `${window.location.origin}${window.location.pathname}?controlEvidenceId=${controlEvidenceIdParam}` }
    }
    return { id, link: `${window.location.origin}${window.location.pathname}?id=${id}` }
  }, [controlEvidenceIdParam, id])

  const where = useMemo(() => buildWhere(evidenceControls, evidenceSubcontrols), [evidenceControls, evidenceSubcontrols])

  const { data: mappedControls } = useGetSuggestedControlsOrSubcontrols({
    where: where,
    enabled: !!where,
  })

  const { data: standards } = useGetStandards({})

  const standardNames = useMemo(() => new Set(standards?.standards?.edges?.flatMap((s) => (s?.node ? [s.node.shortName] : [])) ?? []), [standards])

  useEffect(() => {
    if (!where || !mappedControls || !standardNames.size) {
      setSuggestedControlsMap([])
      return
    }

    const items = flattenAndFilterControls(mappedControls, evidenceControls, evidenceSubcontrols)
      .map((item) => ({
        id: item.id,
        refCode: item.refCode,
        referenceFramework: item.referenceFramework ?? null,
        source: item.source ?? '',
        typeName: item.type,
      }))
      .filter((item) => item.referenceFramework && standardNames.has(item.referenceFramework))

    const uniqueItems = Array.from(new Map(items.map((item) => [item.id, item])).values())

    setSuggestedControlsMap(uniqueItems)
  }, [where, mappedControls, evidenceControls, evidenceSubcontrols, standardNames])

  const { data, isLoading: fetching } = useGetEvidenceById(config.id)

  const [editField, setEditField] = useState<EditableFields | null>(null)

  const { data: permission } = useAccountRoles(ObjectEnum.EVIDENCE, data?.evidence.id)

  const editAllowed = canEdit(permission?.roles)

  const evidence = data?.evidence

  const userIds = []
  if (evidence?.updatedBy) {
    userIds.push(evidence.updatedBy)
  }
  if (evidence?.createdBy) {
    userIds.push(evidence.createdBy)
  }

  const { users } = useGetOrgUserList({ where: { hasUserWith: [{ idIn: userIds }] } })
  const updatedByUser = users?.find((item) => item.id === evidence?.updatedBy)
  const createdByUser = users?.find((item) => item.id === evidence?.createdBy)

  const evidenceName = evidence?.name
  const statusOptions = EvidenceStatusOptions

  const { form } = useFormSchema()

  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const initialAssociations = useMemo(
    () => ({
      programIDs: (evidence?.programs?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],

      controlObjectiveIDs: (evidence?.controlObjectives?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      subcontrolIDs: (evidence?.subcontrols?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) ?? [],
      controlIDs: (evidence?.controls?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) ?? [],
      taskIDs: (evidence?.tasks?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) ?? [],
    }),
    [evidence],
  )

  const initialAssociationsControlsAndPrograms = useMemo(() => {
    if (!evidence)
      return {
        programDisplayIDs: [],
        subcontrolRefCodes: [],
        subcontrolReferenceFramework: {},
        controlRefCodes: [],
        controlReferenceFramework: {},
      }

    const controls: Control[] = evidence.controls?.edges?.map((edge) => edge?.node).filter((n): n is Control => !!n) ?? []
    const subcontrols: Subcontrol[] = evidence.subcontrols?.edges?.map((edge) => edge?.node).filter((n): n is Subcontrol => !!n) ?? []

    return {
      controls,
      subcontrols,
      programDisplayIDs: (evidence.programs?.edges?.map((e) => e?.node?.name).filter(Boolean) as string[]) ?? [],
      subcontrolRefCodes: subcontrols.map((s) => s.refCode),
      subcontrolReferenceFramework: Object.fromEntries(subcontrols.map((s) => [s.id, s.referenceFramework ?? ''])),
      controlRefCodes: controls.map((c) => c.refCode),
      controlReferenceFramework: Object.fromEntries(controls.map((c) => [c.id, c.referenceFramework ?? ''])),
    }
  }, [evidence])

  useEffect(() => {
    if (initialAssociationsControlsAndPrograms.controls) {
      setEvidenceControls(initialAssociationsControlsAndPrograms.controls)
    }
    if (initialAssociationsControlsAndPrograms.subcontrols) {
      setEvidenceSubcontrols(initialAssociationsControlsAndPrograms.subcontrols)
    }
  }, [initialAssociationsControlsAndPrograms])

  useEffect(() => {
    if (evidence) {
      form.reset({
        name: evidence.name ?? '',
        description: evidence?.description ?? '',
        renewalDate: evidence.renewalDate ? new Date(evidence.renewalDate as string) : undefined,
        creationDate: evidence.creationDate ? new Date(evidence.creationDate as string) : undefined,
        status: evidence?.status ? Object.values(EvidenceEvidenceStatus).find((type) => type === evidence?.status) : undefined,
        tags: evidence?.tags ?? [],
        collectionProcedure: evidence?.collectionProcedure || '',
        source: evidence?.source ?? '',
        url: evidence?.url ?? '',
      })

      if (evidence?.tags) {
        const tags = evidence.tags.map((item) => {
          return {
            value: item,
            label: item,
          } as Option
        })
        setTagValues(tags)
      }
    }
  }, [evidence, form])

  const handleInitialValue = useCallback(() => {
    if (initialAssociations && initialAssociationsControlsAndPrograms) {
      form.setValue('controlIDs', initialAssociations.controlIDs ? initialAssociations.controlIDs : [])
      form.setValue('programIDs', initialAssociations.programIDs ? initialAssociations.programIDs : [])
      form.setValue('subcontrolIDs', initialAssociations.subcontrolIDs ? initialAssociations.subcontrolIDs : [])

      setAssociationProgramsRefMap(initialAssociationsControlsAndPrograms.programDisplayIDs ? initialAssociationsControlsAndPrograms.programDisplayIDs : [])
    }
  }, [form, initialAssociations, initialAssociationsControlsAndPrograms])

  useEffect(() => {
    handleInitialValue()
  }, [handleInitialValue])

  const programIDs = form.watch('programIDs')

  const programsAccordionValue = (programIDs?.length || 0) > 0 ? 'ProgramsAccordion' : undefined

  const handleCopyLink = () => {
    if (!config.id) {
      return
    }

    navigator.clipboard
      .writeText(config?.link)
      .then(() => {
        successNotification({
          title: 'Link copied to clipboard',
        })
      })
      .catch(() => {
        errorNotification({
          title: 'Failed to copy link',
        })
      })
  }

  const handleSheetClose = () => {
    if (isEditing) {
      setIsDiscardDialogOpen(true)
      return
    }
    handleCloseParams()
  }

  const handleCloseParams = () => {
    setIsEditing(false)

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('controlEvidenceId')
    newSearchParams.delete('id')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
  }

  const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k as K))) as Omit<T, K>

  const onSubmit = async (formData: EditEvidenceFormData) => {
    const controlIDs = form.getValues('controlIDs') || []
    const subcontrolIDs = form.getValues('subcontrolIDs') || []
    const programIDs = form.getValues('programIDs') || []

    const updatedAssociations = {
      ...associations,
      controlIDs,
      subcontrolIDs,
      programIDs,
    }

    setAssociations(updatedAssociations)

    const associationInputs = getAssociationInput(initialAssociations, updatedAssociations)

    const cleanFormData = omit(formData, ['programIDs', 'controlIDs', 'subcontrolIDs'])

    try {
      let collectionProcedure
      if (formData.collectionProcedure) {
        collectionProcedure = await convertToHtml(formData.collectionProcedure as Value)
      }

      await updateEvidence({
        updateEvidenceId: config.id as string,
        input: {
          ...cleanFormData,
          ...associationInputs,
          collectionProcedure,
          clearURL: formData?.url === undefined,
        },
      })

      successNotification({
        title: 'Evidence Updated',
        description: 'The evidence has been successfully updated.',
      })

      setIsEditing(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteEvidence({ deleteEvidenceId: config.id as string })
      successNotification({ title: `Evidence "${evidence?.name}" deleted successfully` })
      if (controlId) {
        queryClient.invalidateQueries({ queryKey: ['controls', controlId] })
      }

      handleCloseParams()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleDoubleClick = (field: EditableFields) => {
    if (isEditing || !editAllowed) return
    setEditField(field)
  }

  const handleUpdateField = async () => {
    if (!editAllowed || !editField || !config.id) return

    const oldValue = evidence?.[editField]
    const newValue = form.getValues(editField)

    const isSame =
      Array.isArray(oldValue) && Array.isArray(newValue)
        ? oldValue.length === newValue.length && oldValue.every((v, i) => v === newValue[i])
        : oldValue instanceof Date && newValue instanceof Date
        ? oldValue.getTime() === newValue.getTime()
        : oldValue === newValue

    if (isSame) {
      setEditField(null)
      return
    }

    await updateEvidence({
      updateEvidenceId: config.id,
      input: {
        [editField]: form.getValues(editField),
      },
    })
    setEditField(null)
    successNotification({
      title: 'Field updated successfully',
    })
    queryClient.invalidateQueries({ queryKey: ['evidences'] })
    queryClient.invalidateQueries({ queryKey: ['evidences-light'] })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  useEscapeKey(
    () => {
      if (editField) {
        form.setValue(editField, evidence?.[editField] ?? '')
        setEditField(null)
      }
    },
    { enabled: !!editField },
  )

  useClickOutsideWithPortal(
    () => {
      if (['renewalDate', 'creationDate'].includes(editField ?? '')) {
        return setEditField(null)
      }
      if (editField) handleUpdateField()
    },
    {
      refs: { triggerRef, popoverRef },
      enabled: !!editField && ['tags', 'renewalDate', 'creationDate', 'status'].includes(editField),
    },
  )

  useEffect(() => {
    if (isEditPreset) {
      setIsEditing(true)
      setIsEditPreset(false)
      setTimeout(() => {
        requestAnimationFrame(() => {
          objectAssociationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }, 500)
    }
  }, [isEditPreset, setIsEditPreset, setIsEditing])

  const handleTags = () => {
    if (evidence?.tags?.length === 0) {
      return <span className="text-gray-500">no tags provided</span>
    }
    return <div className="flex justify-end flex-wrap gap-2">{evidence?.tags?.map((tag?: string) => tag && <TagChip key={tag} tag={tag} />)} </div>
  }

  const handleSavePrograms = (newIds: string[], newRefCodes: string[]) => {
    setAssociationProgramsRefMap(newRefCodes || [])

    form.setValue('programIDs', newIds)
  }

  return (
    <Sheet open={!!id || !!controlEvidenceIdParam} onOpenChange={handleSheetClose}>
      <SheetContent
        onEscapeKeyDown={(e) => {
          if (editField) {
            e.preventDefault()
          } else {
            handleSheetClose()
          }
        }}
        className="flex flex-col"
        minWidth={600}
        header={
          <SheetHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className={`text-2xl leading-8 font-medium`}>{evidence?.name || 'Untitled'}</span>

                <X aria-label="Close detail sheet" size={20} className="cursor-pointer" onClick={handleSheetClose} />
              </div>

              <div className="flex justify-start gap-2 items-center">
                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <CancelButton onClick={() => setIsEditing(false)}></CancelButton>
                      <SaveButton onClick={form.handleSubmit(onSubmit)} />
                    </>
                  ) : (
                    <>
                      <Button className="h-8 p-2" icon={<Copy />} iconPosition="left" variant="secondary" onClick={handleCopyLink}>
                        Copy link
                      </Button>
                      {evidence && <EvidenceRenewDialog evidenceId={evidence.id} controlId={controlId} />}
                      {editAllowed && (
                        <Button type="button" variant="secondary" className="p-1! h-8 bg-card" onClick={() => setIsEditing(true)} aria-label="Edit evidence">
                          <Pencil size={16} strokeWidth={2} />
                        </Button>
                      )}
                    </>
                  )}
                  <Button type="button" variant="secondary" className="p-1! h-8 bg-card" onClick={() => setDeleteDialogIsOpen(true)} aria-label="Delete evidence">
                    <Trash2 size={16} strokeWidth={2} />
                  </Button>
                </div>
                <ConfirmationDialog
                  open={deleteDialogIsOpen}
                  onOpenChange={setDeleteDialogIsOpen}
                  onConfirm={handleDelete}
                  title={`Delete Evidence`}
                  description={
                    <>
                      This action cannot be undone. This will permanently remove <b>{evidenceName} </b>from the control.
                    </>
                  }
                />
              </div>
            </div>
          </SheetHeader>
        }
      >
        {fetching ? (
          <EvidenceDetailsSheetSkeleton />
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="pr-4">
                {isEditing || editField === 'name' ? (
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input variant="medium" {...field} className="w-full" onBlur={handleUpdateField} onKeyDown={handleKeyDown} autoFocus />
                        </FormControl>
                        {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
                      </FormItem>
                    )}
                  />
                ) : null}
                {isEditing || editField === 'description' ? (
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="w-full pt-4">
                        <div className="flex items-center">
                          <FormLabel>Description</FormLabel>
                          <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a short description of what is contained in the files or linked URLs.</p>} />
                        </div>
                        <FormControl>
                          <Textarea id="description" {...field} className="w-full" onBlur={handleUpdateField} onKeyDown={handleKeyDown} autoFocus />
                        </FormControl>
                        {form.formState.errors.description && <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>}
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="mt-5">
                    <FormLabel className="font-bold">Description</FormLabel>
                    <HoverPencilWrapper
                      pencilClass="!-right-5"
                      showPencil={editAllowed}
                      className={`w-fit ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      onPencilClick={() => editAllowed && handleDoubleClick('description')}
                    >
                      <div onDoubleClick={() => editAllowed && handleDoubleClick('description')}>
                        {evidence?.description ? <p>{evidence.description}</p> : <p className="text-gray-500">no description provided</p>}
                      </div>
                    </HoverPencilWrapper>
                  </div>
                )}

                {isEditing || editField === 'collectionProcedure' ? (
                  <FormField
                    control={form.control}
                    name="collectionProcedure"
                    render={({ field }) => (
                      <FormItem className="w-full pt-4">
                        <div className="flex items-center">
                          <FormLabel>Collection Procedure</FormLabel>
                          <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Write down the steps that were taken to collect the evidence.</p>} />
                        </div>
                        <FormControl>
                          <PlateEditor initialValue={field.value as string} onChange={(val) => field.onChange(val)} />
                        </FormControl>
                        {form.formState.errors.collectionProcedure && <p className="text-red-500 text-sm">{form.formState.errors.collectionProcedure.message}</p>}
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="mt-5">
                    <FormLabel className="font-bold">Collection Procedure</FormLabel>
                    <HoverPencilWrapper showPencil={false} pencilClass="!-right-5" className={`w-fit cursor-not-allowed`}>
                      <div>{evidence?.collectionProcedure ? <p>{convertToReadOnly(evidence.collectionProcedure)}</p> : <p className="text-gray-500">no collection procedure provided</p>}</div>
                    </HoverPencilWrapper>
                  </div>
                )}
                {!isEditing && ((evidenceControls?.length ?? 0) > 0 || (evidenceSubcontrols?.length ?? 0) > 0) && (
                  <Card className={wrapper()}>
                    <CardContent className={content()}>
                      <div className="flex flex-col gap-4">
                        <p className="text-sm font-medium leading-5">Controls</p>
                        <ObjectAssociationControlsChips isEditing={false} evidenceControls={evidenceControls} evidenceSubcontrols={evidenceSubcontrols} />
                      </div>
                    </CardContent>
                  </Card>
                )}
                <div className="mt-6 mb-8">
                  <Card className={wrapper()}>
                    <CardContent className={content()}>
                      <div className="space-y-4">
                        {/* Source */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 text-sm w-[180px]">
                            <CircuitBoard size={16} className="text-accent-secondary" />
                            Source
                          </div>

                          <div className="text-sm text-right w-[250px]">
                            {isEditing || editField === 'source' ? (
                              <InputRow className="w-full">
                                <FormField
                                  control={form.control}
                                  name="source"
                                  render={({ field }) => (
                                    <FormItem className="w-full">
                                      <FormControl>
                                        <Input variant="medium" {...field} className="w-[250px]" onBlur={handleUpdateField} onKeyDown={handleKeyDown} autoFocus />
                                      </FormControl>
                                      {form.formState.errors.source && <p className="text-red-500 text-sm">{form.formState.errors.source.message}</p>}
                                    </FormItem>
                                  )}
                                />
                              </InputRow>
                            ) : (
                              <HoverPencilWrapper
                                showPencil={editAllowed}
                                pencilClass="!-right-5"
                                className={`text-sm text-right w-[250px] ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                onPencilClick={() => handleDoubleClick('source')}
                              >
                                <p onDoubleClick={() => handleDoubleClick('source')}>{evidence?.source || <span className="text-gray-500">no source provided</span>}</p>
                              </HoverPencilWrapper>
                            )}
                          </div>
                        </div>

                        {/* URL */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 text-sm w-[180px]">
                            <LinkIcon size={16} className="text-accent-secondary" />
                            URL
                          </div>

                          <div className="text-sm text-right w-[250px]">
                            {isEditing || editField === 'url' ? (
                              <InputRow className="w-full">
                                <FormField
                                  control={form.control}
                                  name="url"
                                  render={({ field }) => (
                                    <FormItem className="w-full">
                                      <FormControl>
                                        <Input variant="medium" {...field} className="w-[250px]" onBlur={handleUpdateField} onKeyDown={handleKeyDown} autoFocus />
                                      </FormControl>
                                      {form.formState.errors.url && <p className="text-red-500 text-sm">{form.formState.errors.url.message}</p>}
                                    </FormItem>
                                  )}
                                />
                              </InputRow>
                            ) : (
                              <HoverPencilWrapper
                                showPencil={editAllowed}
                                pencilClass="!-right-5"
                                className={`w-[250px] text-right ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                onPencilClick={() => handleDoubleClick('url')}
                              >
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center justify-end w-full" onDoubleClick={() => handleDoubleClick('url')}>
                                        <span className="truncate overflow-hidden whitespace-nowrap text-right">{evidence?.url || <span className="text-gray-500">no url provided</span>}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {evidence?.url ? (
                                        <NextLink href={evidence.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                          {evidence.url}
                                        </NextLink>
                                      ) : (
                                        <span>No URL</span>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </HoverPencilWrapper>
                            )}
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 text-sm w-[180px]">
                            <Binoculars size={16} className="text-accent-secondary" />
                            Status
                          </div>
                          <div ref={triggerRef} className="text-sm text-right w-[250px]">
                            {isEditing || editField === 'status' ? (
                              <Controller
                                name="status"
                                control={form.control}
                                render={({ field }) => (
                                  <>
                                    <Select
                                      value={field.value ?? undefined}
                                      onValueChange={(value) => {
                                        field.onChange(value)
                                        handleUpdateField()
                                      }}
                                    >
                                      <SelectTrigger className="w-[250px]">{EvidenceStatusMapper[field.value as EvidenceEvidenceStatus] || 'Select'}</SelectTrigger>
                                      <SelectContent ref={popoverRef}>
                                        {statusOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {EvidenceStatusMapper[option.value as EvidenceEvidenceStatus]}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {form.formState.errors.status && <p className="text-red-500 text-sm">{form.formState.errors.status.message}</p>}
                                  </>
                                )}
                              />
                            ) : (
                              <HoverPencilWrapper
                                pencilClass="!-right-5"
                                showPencil={editAllowed}
                                className={` space-x-2 w-[250px] ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                onPencilClick={() => editAllowed && handleDoubleClick('status')}
                              >
                                <div className="flex justify-end items-center " onDoubleClick={() => editAllowed && handleDoubleClick('status')}>
                                  {EvidenceIconMapper[evidence?.status as EvidenceEvidenceStatus]}
                                  <p>{EvidenceStatusMapper[evidence?.status as EvidenceEvidenceStatus]}</p>
                                </div>
                              </HoverPencilWrapper>
                            )}
                          </div>
                        </div>

                        {/* Creation Date */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 text-sm w-[180px]">
                            <Calendar size={16} className="text-accent-secondary" />
                            Creation Date
                          </div>

                          <div ref={triggerRef} className="text-sm text-right w-[250px]">
                            {isEditing || editField === 'creationDate' ? (
                              <FormField
                                control={form.control}
                                name="creationDate"
                                render={({ field }) => (
                                  <FormItem ref={popoverRef} className="w-[250px]">
                                    <CalendarPopover
                                      field={field}
                                      defaultToday
                                      required
                                      onChange={(date) => {
                                        field.onChange(date)
                                        handleUpdateField()
                                      }}
                                    />
                                    {form.formState.errors.creationDate && <p className="text-red-500 text-sm">{form.formState.errors.creationDate.message}</p>}
                                  </FormItem>
                                )}
                              />
                            ) : (
                              <HoverPencilWrapper
                                showPencil={editAllowed}
                                pencilClass="!-right-5"
                                className={`text-sm text-right w-[250px] ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                onPencilClick={() => handleDoubleClick('creationDate')}
                              >
                                <p onDoubleClick={() => handleDoubleClick('creationDate')}>{formatDate(evidence?.creationDate) || <span className="text-gray-500">no date provided</span>}</p>
                              </HoverPencilWrapper>
                            )}
                          </div>
                        </div>

                        {/* Renewal Date */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 text-sm w-[180px]">
                            <Calendar size={16} className="text-accent-secondary" />
                            Renewal Date
                          </div>

                          <div ref={triggerRef} className="text-sm text-right w-[250px]">
                            {isEditing || editField === 'renewalDate' ? (
                              <FormField
                                control={form.control}
                                name="renewalDate"
                                render={({ field }) => (
                                  <FormItem ref={popoverRef} className="w-[250px]">
                                    <CalendarPopover
                                      field={field}
                                      defaultAddDays={365}
                                      onChange={(date) => {
                                        field.onChange(date)
                                        handleUpdateField()
                                      }}
                                    />
                                    {form.formState.errors.renewalDate && <p className="text-red-500 text-sm">{form.formState.errors.renewalDate.message}</p>}
                                  </FormItem>
                                )}
                              />
                            ) : (
                              <HoverPencilWrapper
                                showPencil={editAllowed}
                                pencilClass="!-right-5"
                                className={`text-sm text-right w-[250px] ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                onPencilClick={() => handleDoubleClick('renewalDate')}
                              >
                                <p onDoubleClick={() => handleDoubleClick('renewalDate')}>{formatDate(evidence?.renewalDate) || <span className="text-gray-500">no date provided</span>}</p>
                              </HoverPencilWrapper>
                            )}
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm w-[180px]">
                            <Tag size={16} className="text-accent-secondary" />
                            Tags
                          </div>
                          <div ref={triggerRef} className="text-sm text-right w-[250px]">
                            {isEditing || editField === 'tags' ? (
                              <Controller
                                name="tags"
                                control={form.control}
                                render={({ field }) => (
                                  <>
                                    <MultipleSelector
                                      placeholder="Add tag..."
                                      creatable
                                      className="w-[250px]"
                                      commandProps={{ className: 'w-full' }}
                                      value={tagValues}
                                      hideClearAllButton
                                      options={tagOptions}
                                      onChange={(selectedOptions) => {
                                        const options = selectedOptions.map((option) => option.value)
                                        field.onChange(options)
                                        setTagValues(
                                          selectedOptions.map((item) => ({
                                            value: item.value,
                                            label: item.label,
                                          })),
                                        )
                                      }}
                                    />
                                    {form.formState.errors.tags && <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>}
                                  </>
                                )}
                              />
                            ) : (
                              <HoverPencilWrapper
                                pencilClass="!-right-5"
                                showPencil={editAllowed}
                                className={`w-[250px]  ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                onPencilClick={() => editAllowed && handleDoubleClick('tags')}
                              >
                                <div className="" onDoubleClick={() => editAllowed && handleDoubleClick('tags')}>
                                  {handleTags()}
                                </div>
                              </HoverPencilWrapper>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {!isEditing && (
                    <div className="flex flex-col gap-6 mt-6 mb-8">
                      <Card className={wrapper()}>
                        <CardContent className={content()}>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 text-sm w-[180px]">
                                <CalendarCheck2 size={16} className="text-accent-secondary" />
                                Created At
                              </div>
                              <div className="text-sm cursor-not-allowed">
                                <p className="text-sm text-right">{formatDate(evidence?.createdAt)}</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 text-sm w-[180px]">
                                <UserRoundCheck size={16} className="text-accent-secondary" />
                                Created By
                              </div>
                              <div className="text-sm cursor-not-allowed">
                                <p className="text-sm justify-end flex items-center">
                                  <Avatar entity={createdByUser as User} variant="small" />
                                  <span>{createdByUser?.displayName}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 text-sm w-[180px]">
                                <CalendarClock size={16} className="text-accent-secondary" />
                                Updated At
                              </div>
                              <div className="text-sm cursor-not-allowed">
                                <p className="text-sm text-right">{formatDate(evidence?.updatedAt)}</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 text-sm w-[180px]">
                                <UserRoundPen size={16} className="text-accent-secondary" />
                                Updated By
                              </div>
                              <div className="text-sm cursor-not-allowed">
                                <p className="text-sm justify-end flex items-center ">
                                  <Avatar entity={updatedByUser as User} variant="small" />
                                  <span>{updatedByUser?.displayName}</span>
                                </p>
                              </div>
                            </div>
                            {evidence?.url && (
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-sm w-[180px]">
                                  <Link size={16} className="text-accent-secondary" />
                                  URL
                                </div>
                                <div className="text-sm text-left w-[200px] cursor-not-allowed">
                                  <div className="flex items-center gap-4 cursor-pointer">
                                    <p className="flex items-center gap-1">
                                      <Eye size={16} />
                                      View
                                    </p>
                                    <p className="flex items-center gap-1" onClick={() => fileDownload(evidence.url!, 'customFileName', errorNotification)}>
                                      <Download size={16} />
                                      Download
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      <EvidenceCommentsCard />
                    </div>
                  )}
                </div>
              </form>
              {isEditing && (
                <div ref={objectAssociationRef} className="pr-4">
                  <Panel className="mt-5">
                    <Accordion type="single" collapsible defaultValue="ControlsAccordion" className="w-full">
                      <AccordionItem value="ControlsAccordion">
                        <div className="flex items-center justify-between w-full">
                          <AccordionTrigger asChild>
                            <div className="flex items-center gap-2 cursor-pointer group">
                              <ChevronDown size={22} className="text-brand transform -rotate-90 transition-transform group-data-[state=open]:rotate-0" />
                              <span className="text-sm font-medium">Linked Control(s)</span>
                              <span className="rounded-full border border-border text-xs text-muted-foreground flex justify-center items-center h-[26px] w-[26px]">
                                {(form.getValues('subcontrolIDs')?.length || 0) + (form.getValues('controlIDs')?.length || 0)}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <Button
                            variant="secondary"
                            className="py-5"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenControlsDialog(true)
                            }}
                            icon={<Plus />}
                            iconPosition="left"
                          >
                            Add Controls
                          </Button>
                        </div>

                        <AccordionContent>
                          <div className="mt-5 flex flex-col gap-5">
                            <ObjectAssociationControlsChips
                              form={form}
                              suggestedControlsMap={suggestedControlsMap}
                              evidenceControls={evidenceControls}
                              setEvidenceControls={setEvidenceControls}
                              evidenceSubcontrols={evidenceSubcontrols}
                              setEvidenceSubcontrols={setEvidenceSubcontrols}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    <ControlSelectionDialog
                      open={openControlsDialog}
                      onClose={() => setOpenControlsDialog(false)}
                      form={form}
                      evidenceControls={evidenceControls}
                      setEvidenceControls={setEvidenceControls}
                      evidenceSubcontrols={evidenceSubcontrols}
                      setEvidenceSubcontrols={setEvidenceSubcontrols}
                    />
                  </Panel>
                  <Panel className="mt-5">
                    <Accordion type="single" collapsible value={programsAccordionValue} className="w-full">
                      <AccordionItem value="ProgramsAccordion">
                        <div className="flex items-center justify-between w-full">
                          <AccordionTrigger asChild>
                            <div className="flex items-center gap-2 cursor-pointer group">
                              <ChevronDown size={22} className="text-brand transform -rotate-90 transition-transform group-data-[state=open]:rotate-0" />
                              <span className="text-sm font-medium">Linked Program(s)</span>
                              <span className="rounded-full border border-border text-xs text-muted-foreground flex justify-center items-center h-[26px] w-[26px]">
                                {form.getValues('programIDs')?.length || 0}
                              </span>
                            </div>
                          </AccordionTrigger>

                          <Button
                            variant="secondary"
                            className="py-5"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenProgramsDialog(true)
                            }}
                            type="button"
                            icon={<Plus />}
                            iconPosition="left"
                          >
                            Add Programs
                          </Button>
                        </div>

                        <AccordionContent>
                          <div className="mt-5 flex flex-col gap-5">
                            <ObjectAssociationProgramsChips form={form} refMap={associationProgramsRefMap} setRefMap={setAssociationProgramsRefMap} />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <ProgramSelectionDialog
                      form={form}
                      open={openProgramsDialog}
                      onClose={() => setOpenProgramsDialog(false)}
                      initialRefCodes={associationProgramsRefMap}
                      onSave={handleSavePrograms}
                    />
                  </Panel>
                  <Panel className="mt-5">
                    <PanelHeader heading="Associate more objects" noBorder />
                    <p>Associating objects will allow users with access to the object to see the created evidence.</p>
                    <ObjectAssociation
                      initialData={initialAssociations}
                      onIdChange={(updatedMap) => setAssociations(updatedMap)}
                      excludeObjectTypes={[
                        ObjectTypeObjects.EVIDENCE,
                        ObjectTypeObjects.GROUP,
                        ObjectTypeObjects.INTERNAL_POLICY,
                        ObjectTypeObjects.PROCEDURE,
                        ObjectTypeObjects.RISK,
                        ObjectTypeObjects.CONTROL,
                        ObjectTypeObjects.SUB_CONTROL,
                        ObjectTypeObjects.PROGRAM,
                      ]}
                    />
                  </Panel>
                </div>
              )}
              {config.id && (
                <div className="pr-4">
                  <EvidenceFiles editAllowed={editAllowed} evidenceID={config.id} />
                </div>
              )}
            </Form>
          </>
        )}
        <CancelDialog
          isOpen={isDiscardDialogOpen}
          onConfirm={() => {
            setIsDiscardDialogOpen(false)
            handleCloseParams()
            form.reset({
              name: evidence?.name ?? '',
              description: evidence?.description ?? '',
              renewalDate: evidence?.renewalDate ? new Date(evidence.renewalDate as string) : undefined,
              creationDate: evidence?.creationDate ? new Date(evidence.creationDate as string) : undefined,
              status: evidence?.status ?? undefined,
              tags: evidence?.tags ?? [],
              collectionProcedure: evidence?.collectionProcedure as string,
              source: evidence?.source ?? '',
              url: evidence?.url ?? '',
              controlIDs: initialAssociations.controlIDs ?? [],
              subcontrolIDs: initialAssociations.subcontrolIDs ?? [],
              programIDs: initialAssociations.programIDs ?? [],
            })

            setEvidenceControls(initialAssociationsControlsAndPrograms.controls ?? [])
            setEvidenceSubcontrols(initialAssociationsControlsAndPrograms.subcontrols ?? [])
            setAssociationProgramsRefMap(initialAssociationsControlsAndPrograms.programDisplayIDs ?? [])
          }}
          onCancel={() => setIsDiscardDialogOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

export default EvidenceDetailsSheet
