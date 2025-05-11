'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { ArrowRight, Binoculars, Calendar, CalendarCheck2, CalendarClock, CalendarSync, Check, CircuitBoard, InfoIcon, Link, Pencil, Tag, UserRoundCheck, UserRoundPen } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Input } from '@repo/ui/input'
import { useNotification } from '@/hooks/useNotification'
import { Loading } from '@/components/shared/loading/loading'
import { Badge } from '@repo/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { useControlEvidenceStore } from '@/components/pages/protected/controls/hooks/useControlEvidenceStore.ts'
import { useGetEvidenceById, useUpdateEvidence } from '@/lib/graphql-hooks/evidence.ts'
import { formatDate } from '@/utils/date.ts'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { EvidenceEvidenceStatus, User } from '@repo/codegen/src/schema.ts'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import useFormSchema, { EditEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema.ts'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { Controller } from 'react-hook-form'
import { EvidenceStatusMapper } from '@/components/pages/protected/evidence/util/evidence.ts'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { useQueryClient } from '@tanstack/react-query'
import { Textarea } from '@repo/ui/textarea'
import ControlEvidenceFiles from '@/components/pages/protected/controls/control-evidence/control-evidence-files.tsx'

const EvidenceDetailsSheet = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [tagValues, setTagValues] = useState<Option[]>([])
  const queryClient = useQueryClient()

  const { selectedControlEvidence, setSelectedControlEvidence } = useControlEvidenceStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)

  const { mutateAsync: updateEvidence } = useUpdateEvidence()
  const { data, isLoading: fetching } = useGetEvidenceById(selectedControlEvidence as string)
  const evidence = data?.evidence
  const { data: createdByUser } = useGetCurrentUser(evidence?.createdBy)
  const { data: updatedByUser } = useGetCurrentUser(evidence?.updatedBy)
  const statusOptions = Object.values(EvidenceEvidenceStatus)

  const { form } = useFormSchema()

  useEffect(() => {
    if (evidence) {
      form.reset({
        name: evidence.name ?? '',
        description: evidence?.description ?? '',
        renewalDate: evidence.renewalDate ? new Date(evidence.renewalDate as string) : undefined,
        creationDate: evidence.creationDate ? new Date(evidence.creationDate as string) : undefined,
        status: evidence?.status ? Object.values(EvidenceEvidenceStatus).find((type) => type === evidence?.status) : undefined,
        tags: evidence?.tags ?? [],
      })

      if (evidence?.tags) {
        const tags = evidence.tags.map((item: any) => {
          return {
            value: item,
            label: item,
          } as Option
        })
        setTagValues(tags)
      }
    }
  }, [evidence])

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
    console.log('yo')
    try {
      await updateEvidence({
        updateEvidenceId: selectedControlEvidence as string,
        input: formData,
      })

      queryClient.invalidateQueries({ queryKey: ['evidences'] })
      successNotification({
        title: 'Task Updated',
        description: 'The task has been successfully updated.',
      })

      setIsEditing(false)
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an unexpected error. Please try again later.',
      })
    }
  }

  const handleTags = () => {
    return (
      <div className="flex flex-wrap gap-2">{evidence?.tags?.map((item: string | undefined, index: number) => <Fragment key={index}>{item && <Badge variant="outline">{item}</Badge>}</Fragment>)}</div>
    )
  }
  console.log(form.formState.errors)

  return (
    <Sheet open={!!selectedControlEvidence} onOpenChange={handleSheetClose}>
      <SheetContent className="bg-card flex flex-col">
        {fetching ? (
          <Loading />
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <ArrowRight size={16} className="cursor-pointer" onClick={handleSheetClose} />
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
                </div>
              </div>
            </SheetHeader>

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
                          <FormLabel>Details</FormLabel>
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
                  <>{!!evidence?.description && <div className="mt-5">{evidence.description}</div>}</>
                )}

                <div className="relative grid grid-cols-2 gap-8 p-4 border rounded-lg  mt-10">
                  {/* Full-height vertical divider */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-px border" />

                  {/* Left Column */}
                  <div className="space-y-3 pr-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm w-[180px]">
                        <CircuitBoard size={16} className="text-accent-secondary" />
                        Source
                      </div>
                      <div className="text-sm text-left w-[200px]">
                        <p className="text-sm text-left">{evidence?.source}</p>
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
                                        <SelectItem key={option} value={option}>
                                          {EvidenceStatusMapper[option as EvidenceEvidenceStatus]}
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
                          <p className="text-sm text-left">{EvidenceStatusMapper[evidence?.status as EvidenceEvidenceStatus]}</p>
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
                          <Avatar entity={createdByUser?.user as User} variant="small" />
                          <span>{createdByUser?.user?.displayName}</span>
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
                          <Avatar entity={updatedByUser?.user as User} variant="small" />
                          <span>{updatedByUser?.user?.displayName}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
              <ControlEvidenceFiles />
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
