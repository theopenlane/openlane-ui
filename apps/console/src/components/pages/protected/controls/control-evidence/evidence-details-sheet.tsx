'use client'

import React, { Fragment, useEffect, useRef, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import {
  Binoculars,
  Calendar,
  CalendarCheck2,
  CalendarClock,
  Check,
  CircuitBoard,
  Download,
  Eye,
  InfoIcon,
  Link,
  LinkIcon,
  PanelRightClose,
  PencilIcon,
  Tag,
  Trash2,
  UserRoundCheck,
  UserRoundPen,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Input, InputRow } from '@repo/ui/input'
import { useNotification } from '@/hooks/useNotification'
import { Badge } from '@repo/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { useControlEvidenceStore } from '@/components/pages/protected/controls/hooks/useControlEvidenceStore.ts'
import { useDeleteEvidence, useGetEvidenceById, useUpdateEvidence } from '@/lib/graphql-hooks/evidence.ts'
import { formatDate } from '@/utils/date.ts'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { EvidenceEvidenceStatus, User } from '@repo/codegen/src/schema.ts'
import useFormSchema, { EditEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema.ts'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Controller } from 'react-hook-form'
import { EvidenceStatusMapper } from '@/components/pages/protected/evidence/util/evidence.ts'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { useQueryClient } from '@tanstack/react-query'
import { Textarea } from '@repo/ui/textarea'
import ControlEvidenceFiles from '@/components/pages/protected/controls/control-evidence/control-evidence-files.tsx'
import { fileDownload } from '@/components/shared/lib/export.ts'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { ControlEvidenceRenewDialog } from '@/components/pages/protected/controls/control-evidence/control-evidence-renew-dialog.tsx'
import { EvidenceIconMapper, EvidenceStatusOptions } from '@/components/shared/enum-mapper/evidence-enum'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members.ts'
import { Panel, PanelHeader } from '@repo/ui/panel'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association.tsx'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config.ts'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'
import { getAssociationInput } from '@/components/shared/object-association/utils.ts'
import { canEdit } from '@/lib/authz/utils'
import { useAccountRole } from '@/lib/authz/access-api'
import { useSession } from 'next-auth/react'
import useEscapeKey from '@/hooks/useEscapeKey'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { EvidenceDetailsSheetSkeleton } from '../../evidence/skeleton/evidence-details-skeleton'

type TEvidenceDetailsSheet = {
  controlId?: string
}

type EditableFields = 'name' | 'description' | 'collectionProcedure' | 'source' | 'url' | 'status' | 'creationDate' | 'renewalDate' | 'tags'

const EvidenceDetailsSheet: React.FC<TEvidenceDetailsSheet> = ({ controlId }) => {
  const objectAssociationRef = React.useRef<HTMLDivElement | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [tagValues, setTagValues] = useState<Option[]>([])

  const queryClient = useQueryClient()
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false)

  const { selectedControlEvidence, setSelectedControlEvidence, isEditPreset, setIsEditPreset } = useControlEvidenceStore()
  const searchParams = useSearchParams()
  const controlEvidenceIdParam = searchParams?.get('controlEvidenceId')
  const id = searchParams.get('id')
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)
  const [associations, setAssociations] = useState<TObjectAssociationMap>({})

  const { mutateAsync: updateEvidence } = useUpdateEvidence()
  const { mutateAsync: deleteEvidence } = useDeleteEvidence()
  const { data, isLoading: fetching } = useGetEvidenceById(id as string)
  const { data: session } = useSession()

  const [editField, setEditField] = useState<EditableFields | null>(null)

  const { data: permission } = useAccountRole(session, ObjectEnum.EVIDENCE, data?.evidence.id)

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

  useEffect(() => {
    if (controlEvidenceIdParam) {
      setSelectedControlEvidence(controlEvidenceIdParam)
    }
  }, [controlEvidenceIdParam, setSelectedControlEvidence])

  useEffect(() => {
    if (evidence) {
      form.reset({
        name: evidence.name ?? '',
        description: evidence?.description ?? '',
        renewalDate: evidence.renewalDate ? new Date(evidence.renewalDate as string) : undefined,
        creationDate: evidence.creationDate ? new Date(evidence.creationDate as string) : undefined,
        status: evidence?.status ? Object.values(EvidenceEvidenceStatus).find((type) => type === evidence?.status) : undefined,
        tags: evidence?.tags ?? [],
        collectionProcedure: evidence?.collectionProcedure ?? '',
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

  const handleCopyLink = () => {
    if (!selectedControlEvidence) {
      return
    }

    const url = `${window.location.origin}${window.location.pathname}?controlEvidenceId=${selectedControlEvidence}`
    navigator.clipboard
      .writeText(url)
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

  const onSubmit = async (formData: EditEvidenceFormData) => {
    const associationInputs = getAssociationInput(initialAssociations, associations)

    try {
      await updateEvidence({
        updateEvidenceId: selectedControlEvidence as string,
        input: {
          ...formData,
          ...associationInputs,
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
      await deleteEvidence({ deleteEvidenceId: selectedControlEvidence as string })
      successNotification({ title: `Evidence "${evidence?.name}" deleted successfully` })
      if (controlId) {
        queryClient.invalidateQueries({ queryKey: ['controls', controlId] })
      }
      setSelectedControlEvidence(null)
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
    if (!editAllowed || !editField) return

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
      updateEvidenceId: selectedControlEvidence as string,
      input: {
        [editField]: form.getValues(editField),
      },
    })
    setEditField(null)
    successNotification({
      title: 'Field updated successfully',
    })
    queryClient.invalidateQueries({ queryKey: ['evidences'] })
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
    return (
      <div className="flex flex-wrap gap-2">{evidence?.tags?.map((item: string | undefined, index: number) => <Fragment key={index}>{item && <Badge variant="outline">{item}</Badge>}</Fragment>)}</div>
    )
  }

  return (
    <Sheet open={!!id} onOpenChange={handleSheetClose}>
      <SheetContent
        onEscapeKeyDown={(e) => {
          if (editField) {
            e.preventDefault()
          } else {
            handleSheetClose()
          }
        }}
        className="bg-card flex flex-col"
        minWidth={600}
        header={
          <SheetHeader>
            <div className="flex items-center justify-between">
              <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={handleSheetClose} />
              <div className="flex justify-end gap-2 items-center">
                <Button className="h-8 p-2" icon={<Link />} iconPosition="left" variant="outline" onClick={handleCopyLink}>
                  Copy link
                </Button>
                {evidence && <ControlEvidenceRenewDialog evidenceId={evidence.id} controlId={controlId} />}
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button className="h-8 p-2" type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button className="h-8 p-2" onClick={form.handleSubmit(onSubmit)} icon={<Check />} iconPosition="left">
                      Save
                    </Button>
                  </div>
                ) : (
                  <>
                    {editAllowed && (
                      <Button type="button" variant="outline" className="!p-1 h-8 bg-card" onClick={() => setIsEditing(true)} aria-label="Edit evidence">
                        <PencilIcon size={16} strokeWidth={2} />
                      </Button>
                    )}
                  </>
                )}
                <Button type="button" variant="outline" className="!p-1 h-8 bg-card" onClick={() => setDeleteDialogIsOpen(true)} aria-label="Delete evidence">
                  <Trash2 size={16} strokeWidth={2} />
                </Button>

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
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <SheetTitle>
                  {isEditing || editField === 'name' ? (
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <div className="flex items-center">
                            <FormLabel>Title</FormLabel>
                            <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive title to help easily identify the task later.</p>} />
                          </div>
                          <FormControl>
                            <Input variant="medium" {...field} className="w-full" onBlur={handleUpdateField} onKeyDown={handleKeyDown} autoFocus />
                          </FormControl>
                          {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
                        </FormItem>
                      )}
                    />
                  ) : (
                    <span onDoubleClick={() => handleDoubleClick('name')} className={editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}>
                      {evidence?.name}
                    </span>
                  )}
                </SheetTitle>

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
                    <div onDoubleClick={() => handleDoubleClick('description')} className={editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}>
                      {evidence?.description ? <p>{evidence?.description}</p> : <p className="text-gray-500">no description provided</p>}
                    </div>
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
                          <Textarea id="collectionProcedure" {...field} className="w-full" onBlur={handleUpdateField} onKeyDown={handleKeyDown} autoFocus />
                        </FormControl>
                        {form.formState.errors.collectionProcedure && <p className="text-red-500 text-sm">{form.formState.errors.collectionProcedure.message}</p>}
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className={`mt-5 ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`} onDoubleClick={() => handleDoubleClick('collectionProcedure')}>
                    <FormLabel className="font-bold">Collection Procedure</FormLabel>
                    {evidence?.collectionProcedure ? <p>{evidence?.collectionProcedure}</p> : <p className="text-gray-500">no collection procedure provided</p>}
                  </div>
                )}

                <div className="relative grid grid-cols-2 gap-8 p-4 border rounded-lg mt-10">
                  <div className="absolute top-0 bottom-0 left-1/2 w-px border" />

                  {/* Left Column */}
                  <div className="space-y-3 pr-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <CircuitBoard size={16} className="text-accent-secondary" />
                        Source
                      </div>
                      <div className="text-sm text-left w-[200px]">
                        {isEditing || editField === 'source' ? (
                          <InputRow className="w-full">
                            <FormField
                              control={form.control}
                              name="source"
                              render={({ field }) => (
                                <FormItem className="w-full">
                                  <FormControl>
                                    <Input variant="medium" {...field} className="w-full" onBlur={handleUpdateField} onKeyDown={handleKeyDown} autoFocus />
                                  </FormControl>
                                  {form.formState.errors.source && <p className="text-red-500 text-sm">{form.formState.errors.source.message}</p>}
                                </FormItem>
                              )}
                            />
                          </InputRow>
                        ) : (
                          <p className={`text-sm text-left ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`} onDoubleClick={() => handleDoubleClick('source')}>
                            {evidence?.source || <span className="text-gray-500">no source provided</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <LinkIcon size={16} className="text-accent-secondary" />
                        URL
                      </div>
                      <div className="text-sm text-left w-[200px]">
                        {isEditing || editField === 'url' ? (
                          <InputRow className="w-full">
                            <FormField
                              control={form.control}
                              name="url"
                              render={({ field }) => (
                                <FormItem className="w-full">
                                  <FormControl>
                                    <Input variant="medium" {...field} className="w-full" onBlur={handleUpdateField} onKeyDown={handleKeyDown} autoFocus />
                                  </FormControl>
                                  {form.formState.errors.url && <p className="text-red-500 text-sm">{form.formState.errors.url.message}</p>}
                                </FormItem>
                              )}
                            />
                          </InputRow>
                        ) : (
                          <p className={`text-sm text-left ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`} onDoubleClick={() => handleDoubleClick('url')}>
                            {evidence?.url || <span className="text-gray-500">no url provided</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <Binoculars size={16} className="text-accent-secondary" />
                        Status
                      </div>
                      <div ref={triggerRef} className="text-sm text-left w-[200px]">
                        {isEditing || editField === 'status' ? (
                          <Controller
                            name="status"
                            control={form.control}
                            render={({ field }) => {
                              return (
                                <>
                                  <Select
                                    value={field.value ?? undefined}
                                    onValueChange={(value) => {
                                      field.onChange(value)
                                      handleUpdateField()
                                    }}
                                  >
                                    <SelectTrigger className="w-full">{EvidenceStatusMapper[field.value as EvidenceEvidenceStatus] || 'Select'}</SelectTrigger>
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
                              )
                            }}
                          />
                        ) : (
                          <div className={`flex items-center space-x-2 ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`} onDoubleClick={() => handleDoubleClick('status')}>
                            {EvidenceIconMapper[evidence?.status as EvidenceEvidenceStatus]}
                            <p>{EvidenceStatusMapper[evidence?.status as EvidenceEvidenceStatus]}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <Calendar size={16} className="text-accent-secondary" />
                        Creation Date
                      </div>
                      <div ref={triggerRef} className="text-sm text-left w-[200px]">
                        {isEditing || editField === 'creationDate' ? (
                          <FormField
                            control={form.control}
                            name="creationDate"
                            render={({ field }) => (
                              <FormItem ref={popoverRef} className="w-full">
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
                          <p className={`text-sm text-left ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`} onDoubleClick={() => handleDoubleClick('creationDate')}>
                            {formatDate(evidence?.creationDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <Calendar size={16} className="text-accent-secondary" />
                        Renewal Date
                      </div>
                      <div ref={triggerRef} className="text-sm text-left w-[200px]">
                        {isEditing || editField === 'renewalDate' ? (
                          <FormField
                            control={form.control}
                            name="renewalDate"
                            render={({ field }) => (
                              <FormItem ref={popoverRef} className="w-full">
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
                          <p className={`text-sm text-left ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`} onDoubleClick={() => handleDoubleClick('renewalDate')}>
                            {formatDate(evidence?.renewalDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <Tag size={16} className="text-accent-secondary" />
                        Tags
                      </div>
                      <div ref={triggerRef} className="text-sm text-left w-[200px]">
                        {isEditing || editField === 'tags' ? (
                          <Controller
                            name="tags"
                            control={form.control}
                            render={({ field }) => {
                              return (
                                <>
                                  <MultipleSelector
                                    placeholder="Add tag..."
                                    creatable
                                    className="w-[180px]"
                                    commandProps={{ className: 'w-full' }}
                                    value={tagValues}
                                    hideClearAllButton
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
                              )
                            }}
                          />
                        ) : (
                          <div onDoubleClick={() => handleDoubleClick('tags')} className={editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}>
                            {handleTags()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3 pl-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <CalendarCheck2 size={16} className="text-accent-secondary" />
                        Created At
                      </div>
                      <div className="text-sm text-left w-[200px] cursor-not-allowed">
                        <p className="text-sm text-left">{formatDate(evidence?.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <UserRoundCheck size={16} className="text-accent-secondary" />
                        Created By
                      </div>
                      <div className="text-sm text-left w-[200px] cursor-not-allowed">
                        <p className="text-sm flex items-center">
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
                      <div className="text-sm text-left w-[200px] cursor-not-allowed">
                        <p className="text-sm text-left">{formatDate(evidence?.updatedAt)}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <UserRoundPen size={16} className="text-accent-secondary" />
                        Updated By
                      </div>
                      <div className="text-sm text-left w-[200px] cursor-not-allowed">
                        <p className="text-sm flex items-center ">
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
                </div>
              </form>
              {isEditing && (
                <div ref={objectAssociationRef}>
                  <Panel className="mt-5">
                    <PanelHeader heading="Object association" noBorder />
                    <p>Associating objects will allow users with access to the object to see the created evidence.</p>
                    <ObjectAssociation
                      initialData={initialAssociations}
                      onIdChange={(updatedMap) => setAssociations(updatedMap)}
                      excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.GROUP, ObjectTypeObjects.INTERNAL_POLICY, ObjectTypeObjects.PROCEDURE, ObjectTypeObjects.RISK]}
                    />
                  </Panel>
                </div>
              )}
              {selectedControlEvidence && <ControlEvidenceFiles editAllowed={editAllowed} controlEvidenceID={selectedControlEvidence} />}
            </Form>
          </>
        )}
        <CancelDialog
          isOpen={isDiscardDialogOpen}
          onConfirm={() => {
            setIsDiscardDialogOpen(false)
            handleCloseParams()
          }}
          onCancel={() => setIsDiscardDialogOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

export default EvidenceDetailsSheet
