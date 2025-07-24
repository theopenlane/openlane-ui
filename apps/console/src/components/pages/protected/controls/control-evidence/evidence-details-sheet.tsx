'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import {
  Binoculars,
  Calendar,
  CalendarCheck2,
  CalendarClock,
  CalendarSync,
  Check,
  CircuitBoard,
  Download,
  Eye,
  InfoIcon,
  Link,
  LinkIcon,
  PanelRightClose,
  Pencil,
  Tag,
  Trash2,
  UserRoundCheck,
  UserRoundPen,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Input, InputRow } from '@repo/ui/input'
import { useNotification } from '@/hooks/useNotification'
import { Loading } from '@/components/shared/loading/loading'
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

type TEvidenceDetailsSheet = {
  controlId?: string
}

const EvidenceDetailsSheet: React.FC<TEvidenceDetailsSheet> = ({ controlId }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tagValues, setTagValues] = useState<Option[]>([])
  const queryClient = useQueryClient()
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false)

  const { selectedControlEvidence, setSelectedControlEvidence } = useControlEvidenceStore()
  const searchParams = useSearchParams()
  const controlEvidenceIdParam = searchParams?.get('controlEvidenceId')
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)

  const { mutateAsync: updateEvidence } = useUpdateEvidence()
  const { mutateAsync: deleteEvidence } = useDeleteEvidence()
  const { data, isLoading: fetching } = useGetEvidenceById(selectedControlEvidence)
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
    setSelectedControlEvidence(null)
    setIsEditing(false)

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('controlEvidenceId')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
  }

  const onSubmit = async (formData: EditEvidenceFormData) => {
    try {
      await updateEvidence({
        updateEvidenceId: selectedControlEvidence as string,
        input: {
          ...formData,
          clearURL: formData?.url === undefined,
        },
      })

      successNotification({
        title: 'Evidence Updated',
        description: 'The evidence has been successfully updated.',
      })

      setIsEditing(false)
    } catch {
      errorNotification({
        title: 'Error',
        description: 'There was an unexpected error. Please try again later.',
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
    } catch {
      errorNotification({ title: 'Failed to delete evidence.' })
    }
  }

  const handleTags = () => {
    return (
      <div className="flex flex-wrap gap-2">{evidence?.tags?.map((item: string | undefined, index: number) => <Fragment key={index}>{item && <Badge variant="outline">{item}</Badge>}</Fragment>)}</div>
    )
  }

  return (
    <Sheet open={!!selectedControlEvidence} onOpenChange={handleSheetClose}>
      <SheetContent
        className="bg-card flex flex-col"
        minWidth={600}
        header={
          <SheetHeader>
            <div className="flex items-center justify-between">
              <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={handleSheetClose} />
              <div className="flex justify-end gap-2">
                <Button icon={<Link />} iconPosition="left" variant="outline" onClick={handleCopyLink}>
                  Copy link
                </Button>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={form.handleSubmit(onSubmit)} icon={<Check />} iconPosition="left">
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button icon={<Pencil />} iconPosition="left" variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}
                {evidence && <ControlEvidenceRenewDialog evidenceId={evidence.id} controlId={controlId} />}
                <Button icon={<Trash2 />} iconPosition="left" variant="outline" onClick={() => setDeleteDialogIsOpen(true)}>
                  Delete
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
          <Loading />
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <SheetTitle>
                  {isEditing ? (
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
                            <Input variant="medium" {...field} className="w-full" />
                          </FormControl>
                          {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
                        </FormItem>
                      )}
                    />
                  ) : (
                    evidence?.name
                  )}
                </SheetTitle>

                {isEditing ? (
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
                          <Textarea id="description" {...field} className="w-full" />
                        </FormControl>
                        {form.formState.errors.description && <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>}
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="mt-5">
                    <FormLabel className="font-bold">Description</FormLabel>
                    {evidence?.description ? <p>{evidence?.description}</p> : <p className="text-gray-500">no description provided</p>}
                  </div>
                )}

                {isEditing ? (
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
                          <Textarea id="collectionProcedure" {...field} className="w-full" />
                        </FormControl>
                        {form.formState.errors.collectionProcedure && <p className="text-red-500 text-sm">{form.formState.errors.collectionProcedure.message}</p>}
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="mt-5">
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
                        {isEditing ? (
                          <InputRow className="w-full">
                            <FormField
                              control={form.control}
                              name="source"
                              render={({ field }) => (
                                <FormItem className="w-full">
                                  <FormControl>
                                    <Input variant="medium" {...field} className="w-full" />
                                  </FormControl>
                                  {form.formState.errors.source && <p className="text-red-500 text-sm">{form.formState.errors.source.message}</p>}
                                </FormItem>
                              )}
                            />
                          </InputRow>
                        ) : (
                          <p className="text-sm text-left">{evidence?.source}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <LinkIcon size={16} className="text-accent-secondary" />
                        URL
                      </div>
                      <div className="text-sm text-left w-[200px]">
                        {isEditing ? (
                          <InputRow className="w-full">
                            <FormField
                              control={form.control}
                              name="url"
                              render={({ field }) => (
                                <FormItem className="w-full">
                                  <FormControl>
                                    <Input variant="medium" {...field} className="w-full" />
                                  </FormControl>
                                  {form.formState.errors.url && <p className="text-red-500 text-sm">{form.formState.errors.url.message}</p>}
                                </FormItem>
                              )}
                            />
                          </InputRow>
                        ) : (
                          <p className="text-sm text-left">{evidence?.url}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <Binoculars size={16} className="text-accent-secondary" />
                        Status
                      </div>
                      <div className="text-sm text-left w-[200px]">
                        {isEditing ? (
                          <Controller
                            name="status"
                            control={form.control}
                            render={({ field }) => {
                              return (
                                <>
                                  <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">{EvidenceStatusMapper[field.value as EvidenceEvidenceStatus] || 'Select'}</SelectTrigger>
                                    <SelectContent>
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
                          <div className="flex items-center space-x-2">
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
                      <div className="text-sm text-left w-[200px]">
                        {isEditing ? (
                          <FormField
                            control={form.control}
                            name="creationDate"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <CalendarPopover field={field} defaultToday required />
                                {form.formState.errors.creationDate && <p className="text-red-500 text-sm">{form.formState.errors.creationDate.message}</p>}
                              </FormItem>
                            )}
                          />
                        ) : (
                          <p className="text-sm text-left">{formatDate(evidence?.creationDate)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <CalendarSync size={16} className="text-accent-secondary" />
                        Renewal Date
                      </div>
                      <div className="text-sm text-left w-[200px]">
                        {isEditing ? (
                          <FormField
                            control={form.control}
                            name="renewalDate"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <CalendarPopover field={field} defaultAddDays={365} />
                                {form.formState.errors.renewalDate && <p className="text-red-500 text-sm">{form.formState.errors.renewalDate.message}</p>}
                              </FormItem>
                            )}
                          />
                        ) : (
                          <p className="text-sm text-left">{formatDate(evidence?.renewalDate)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <Tag size={16} className="text-accent-secondary" />
                        Tags
                      </div>
                      <div className="text-sm text-left w-[200px]">
                        {isEditing ? (
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
                                    commandProps={{
                                      className: 'w-full',
                                    }}
                                    value={tagValues}
                                    onChange={(selectedOptions) => {
                                      const options = selectedOptions.map((option) => option.value)
                                      field.onChange(options)
                                      setTagValues(
                                        selectedOptions.map((item) => {
                                          return {
                                            value: item.value,
                                            label: item.label,
                                          }
                                        }),
                                      )
                                    }}
                                  />
                                  {form.formState.errors.tags && <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>}
                                </>
                              )
                            }}
                          />
                        ) : (
                          <>{handleTags()}</>
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
                      <div className="text-sm text-left w-[200px]">
                        <p className="text-sm text-left">{formatDate(evidence?.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <UserRoundCheck size={16} className="text-accent-secondary" />
                        Created By
                      </div>
                      <div className="text-sm text-left w-[200px]">
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
                      <div className="text-sm text-left w-[200px]">
                        <p className="text-sm text-left">{formatDate(evidence?.updatedAt)}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <UserRoundPen size={16} className="text-accent-secondary" />
                        Updated By
                      </div>
                      <div className="text-sm text-left w-[200px]">
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
                        <div className="text-sm text-left w-[200px]">
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
              {selectedControlEvidence && <ControlEvidenceFiles controlEvidenceID={selectedControlEvidence} />}
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
