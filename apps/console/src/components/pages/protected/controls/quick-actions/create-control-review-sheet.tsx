'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { type Value } from 'platejs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetHeader } from '@repo/ui/sheet'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Button } from '@repo/ui/button'
import { Panel } from '@repo/ui/panel'
import { Checkbox } from '@repo/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { ChevronDown, InfoIcon, X } from 'lucide-react'
import { type CreateFindingInput, type CreateReviewInput, FindingSecurityLevel, ReviewReviewStatus, type Group } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useGetControlById, useGetControlRelatedControls } from '@/lib/graphql-hooks/control'
import { useCreateReview, useUpdateReview } from '@/lib/graphql-hooks/review'
import { useCreateFinding } from '@/lib/graphql-hooks/finding'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { isPlateValueEmpty } from '@/components/shared/plate/plate-utils'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { UploadedEvidenceSection } from './uploaded-evidence-section'

const controlReviewSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  testApplied: z.string().optional(),
  auditorNotes: z.custom<Value | string>().optional(),
  externalID: z.string().optional(),
  linkedControlIDs: z.array(z.string()),
  linkedSubcontrolIDs: z.array(z.string()),
  findingTitle: z.string().optional(),
  findingSeverity: z.nativeEnum(FindingSecurityLevel).optional(),
  findingDescription: z.string().optional(),
})

type ControlReviewFormData = z.infer<typeof controlReviewSchema>

type TRelatedItem = { id: string; refCode: string; field: 'linkedControlIDs' | 'linkedSubcontrolIDs' }

const SEVERITY_OPTIONS = [FindingSecurityLevel.CRITICAL, FindingSecurityLevel.HIGH, FindingSecurityLevel.MEDIUM, FindingSecurityLevel.LOW, FindingSecurityLevel.NONE]

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

type TCreateControlReviewSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  controlId: string
  subcontrolId?: string
  programId?: string
}

const CreateControlReviewSheet: React.FC<TCreateControlReviewSheetProps> = ({ open, onOpenChange, controlId, subcontrolId, programId }) => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const { data: controlData } = useGetControlById(open ? controlId : null)
  const { data: relatedData } = useGetControlRelatedControls(open ? controlId : null)

  const { mutateAsync: createReview } = useCreateReview()
  const { mutateAsync: updateReview } = useUpdateReview()
  const { mutateAsync: createFinding } = useCreateFinding()
  const plateEditorHelper = usePlateEditor()

  const [clearAuditorNotes, setClearAuditorNotes] = useState(false)
  const [showFinding, setShowFinding] = useState(false)
  const [showRelated, setShowRelated] = useState(false)
  const [pendingAction, setPendingAction] = useState<ReviewReviewStatus | null>(null)
  const createdReviewIdRef = useRef<string | null>(null)

  const { push } = useSmartRouter()

  const control = controlData?.control
  const relatedControls = useMemo(() => relatedData?.control?.relatedControls ?? [], [relatedData])
  const subcontrols = useMemo(() => (control?.subcontrols?.edges ?? []).map((edge) => edge?.node).filter((node): node is NonNullable<typeof node> => !!node), [control])
  const evidenceItems = useMemo(() => (control?.evidence?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : [])), [control])

  const openEvidenceSheet = (evidenceId: string) => push({ id: evidenceId })

  const relatedGroups = useMemo(() => {
    const groups = new Map<string, { label: string; framework?: string; isSubcontrols: boolean; items: TRelatedItem[] }>()
    const add = (key: string, label: string, framework: string | undefined, isSubcontrols: boolean, item: TRelatedItem) => {
      const existing = groups.get(key)
      if (existing) {
        existing.items.push(item)
      } else {
        groups.set(key, { label, framework, isSubcontrols, items: [item] })
      }
    }
    subcontrols.forEach((sub) => add('subcontrols', 'Subcontrols', undefined, true, { id: sub.id, refCode: sub.refCode, field: 'linkedSubcontrolIDs' }))
    relatedControls
      .filter((related) => related.referenceFramework !== 'OTS')
      .forEach((related) => {
        const framework = related.referenceFramework ?? undefined
        add(framework ?? 'custom', framework ?? 'CUSTOM', framework, false, {
          id: related.id,
          refCode: related.refCode,
          field: related.isSubcontrol ? 'linkedSubcontrolIDs' : 'linkedControlIDs',
        })
      })
    return Array.from(groups.values())
  }, [relatedControls, subcontrols])

  const totalRelatedCount = useMemo(() => relatedGroups.reduce((sum, group) => sum + group.items.length, 0), [relatedGroups])

  const form = useForm<ControlReviewFormData>({
    resolver: zodResolver(controlReviewSchema),
    defaultValues: { title: '', linkedControlIDs: [], linkedSubcontrolIDs: [] },
  })

  useEffect(() => {
    if (open && control?.refCode && !form.getValues('title')) {
      form.setValue('title', `${control.refCode} Review - ${new Date().getFullYear()}`)
    }
  }, [open, control?.refCode, form])

  const resetAndClose = () => {
    createdReviewIdRef.current = null
    form.reset({ title: '', linkedControlIDs: [], linkedSubcontrolIDs: [] })
    setClearAuditorNotes(true)
    setShowFinding(false)
    onOpenChange(false)
  }

  const hideFinding = () => {
    form.resetField('findingTitle')
    form.resetField('findingSeverity')
    form.resetField('findingDescription')
    setShowFinding(false)
  }

  const submit = async (data: ControlReviewFormData, status: ReviewReviewStatus) => {
    setPendingAction(status)
    try {
      const controlIDs = subcontrolId ? [...data.linkedControlIDs] : [controlId, ...data.linkedControlIDs]
      const subcontrolIDs = subcontrolId ? [subcontrolId, ...data.linkedSubcontrolIDs] : [...data.linkedSubcontrolIDs]

      let reviewId = createdReviewIdRef.current
      if (!reviewId) {
        const input: CreateReviewInput = {
          title: data.title,
          status,
          reporter: session?.user?.email ?? undefined,
          reviewerID: session?.user?.userId ?? undefined,
          reportedAt: new Date().toISOString(),
          ...(data.testApplied ? { details: data.testApplied } : {}),
          ...(data.externalID ? { externalID: data.externalID } : {}),
          controlIDs,
          subcontrolIDs,
          ...(programId ? { programIDs: [programId] } : {}),
        }

        const res = await createReview({ input })
        reviewId = res.createReview.review.id
        createdReviewIdRef.current = reviewId

        if (!isPlateValueEmpty(data.auditorNotes)) {
          const text = typeof data.auditorNotes === 'string' ? data.auditorNotes : await plateEditorHelper.convertToHtml(data.auditorNotes as Value)
          await updateReview({ updateReviewId: reviewId, input: { addComment: { text } } })
        }
      }

      const hasFinding = !!(data.findingTitle?.trim() || data.findingDescription?.trim() || data.findingSeverity)
      if (hasFinding) {
        const findingInput: CreateFindingInput = {
          findingStatusName: 'Open',
          open: true,
          reviewIDs: [reviewId],
          controlIDs: subcontrolId ? [] : [controlId],
          ...(subcontrolId ? { subcontrolIDs: [subcontrolId] } : {}),
          ...(data.findingTitle?.trim() ? { displayName: data.findingTitle.trim() } : {}),
          ...(data.findingDescription?.trim() ? { description: data.findingDescription.trim() } : {}),
          ...(data.findingSeverity ? { severity: data.findingSeverity } : {}),
        }
        await createFinding({ input: findingInput })
      }

      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['findings'] })
      queryClient.invalidateQueries({ queryKey: ['controls', controlId, 'associations'] })

      successNotification({ title: status === ReviewReviewStatus.COMPLETED ? 'Review created' : 'Draft saved', description: `The review has been saved as ${titleCase(status)}.` })
      resetAndClose()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setPendingAction(null)
    }
  }

  const toggleId = (field: 'linkedControlIDs' | 'linkedSubcontrolIDs', id: string, checked: boolean) => {
    const current = form.getValues(field)
    form.setValue(field, checked ? [...current, id] : current.filter((value) => value !== id))
  }

  const selectedControlIDs = form.watch('linkedControlIDs')
  const selectedSubcontrolIDs = form.watch('linkedSubcontrolIDs')

  const isItemSelected = (item: TRelatedItem) => (item.field === 'linkedSubcontrolIDs' ? selectedSubcontrolIDs : selectedControlIDs).includes(item.id)

  const setGroupSelection = (items: TRelatedItem[], checked: boolean) => {
    const controlIDs = items.filter((item) => item.field === 'linkedControlIDs').map((item) => item.id)
    const subcontrolIDs = items.filter((item) => item.field === 'linkedSubcontrolIDs').map((item) => item.id)
    if (controlIDs.length) {
      const current = form.getValues('linkedControlIDs')
      form.setValue('linkedControlIDs', checked ? Array.from(new Set([...current, ...controlIDs])) : current.filter((id) => !controlIDs.includes(id)))
    }
    if (subcontrolIDs.length) {
      const current = form.getValues('linkedSubcontrolIDs')
      form.setValue('linkedSubcontrolIDs', checked ? Array.from(new Set([...current, ...subcontrolIDs])) : current.filter((id) => !subcontrolIDs.includes(id)))
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : resetAndClose())}>
      <SheetContent
        minWidth={600}
        className="flex flex-col"
        header={
          <SheetHeader>
            <div className="flex items-center justify-between">
              <span className="text-2xl leading-8 font-medium">Create Review</span>
              <X aria-label="Close create review sheet" size={20} className="cursor-pointer" onClick={resetAndClose} />
            </div>
          </SheetHeader>
        }
      >
        <Form {...form}>
          <form className="flex flex-col gap-4 pr-2 pb-4" onSubmit={(e) => e.preventDefault()}>
            <Panel className="p-4 flex flex-col gap-3">
              <p className="text-lg font-medium">Control Context</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{control?.refCode ?? '—'}</span>
                {control?.title ? <span className="text-muted-foreground">{control.title}</span> : null}
                {control?.auditorReferenceID ? <span className="text-xs text-muted-foreground">({control.auditorReferenceID})</span> : null}
              </div>
              {control?.description ? <p className="text-sm text-muted-foreground">{control.description}</p> : null}
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Framework</span>
                  <StandardChip referenceFramework={control?.referenceFramework ?? undefined} />
                </div>
                {control?.controlOwner ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Control Owner</span>
                    <div className="flex items-center gap-2">
                      <Avatar entity={control.controlOwner as Group} className="h-6 w-6" />
                      <span>{control.controlOwner.displayName || '-'}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              {totalRelatedCount > 0 && (
                <div className="flex flex-col gap-2">
                  <button type="button" className="group flex items-center gap-2 text-sm text-muted-foreground self-start" onClick={() => setShowRelated((prev) => !prev)}>
                    <ChevronDown size={16} className={`transition-transform ${showRelated ? '' : '-rotate-90'}`} />
                    <span>Also link to related controls</span>
                    <span className="rounded-full border border-border text-xs flex items-center justify-center h-5 min-w-5 px-1">{totalRelatedCount}</span>
                  </button>
                  {showRelated && (
                    <div className="flex flex-col gap-4 pl-1">
                      {relatedGroups.map((group) => {
                        const allSelected = group.items.every(isItemSelected)
                        return (
                          <div key={group.label} className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox checked={allSelected} onCheckedChange={(checked) => setGroupSelection(group.items, checked === true)} />
                              {group.isSubcontrols ? <span className="font-medium">{group.label}</span> : <StandardChip referenceFramework={group.framework} />}
                              <span className="text-xs text-muted-foreground">Select all</span>
                            </label>
                            <div className="flex flex-col gap-2 pl-6">
                              {group.items.map((item) => (
                                <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                  <Checkbox checked={isItemSelected(item)} onCheckedChange={(checked) => toggleId(item.field, item.id, checked === true)} />
                                  <span>{item.refCode}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </Panel>

            <UploadedEvidenceSection items={evidenceItems} controlId={controlId} programId={programId} onView={openEvidenceSheet} />

            <Panel className="p-4 flex flex-col gap-3">
              <p className="text-lg font-medium">Review</p>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Review Title <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className="w-full" placeholder="Review title" />
                    </FormControl>
                    {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="testApplied"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Applied</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} rows={3} placeholder="Describe the test applied, e.g. Inspected the Human Resource Security Policy to determine that..." />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="auditorNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auditor Notes</FormLabel>
                    <FormControl>
                      <PlateEditor onChange={field.onChange} initialValue="" clearData={clearAuditorNotes} onClear={() => setClearAuditorNotes(false)} placeholder="Add notes about this review..." />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="externalID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External ID</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} className="w-full" placeholder="Optional external reference" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </Panel>

            <Panel className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <InfoIcon size={16} className="text-warning" />
                  <p className="text-lg font-medium">Add a Finding</p>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                {showFinding && <X aria-label="Remove finding" size={16} className="cursor-pointer text-muted-foreground" onClick={hideFinding} />}
              </div>
              {showFinding ? (
                <>
                  <p className="text-xs text-muted-foreground">Findings must be created inside a review. Once this review is saved, you can add more findings from the review page.</p>
                  <FormField
                    control={form.control}
                    name="findingTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Finding Title</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} className="w-full" placeholder="Describe the finding..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="findingSeverity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity</FormLabel>
                        <FormControl>
                          <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select severity..." />
                            </SelectTrigger>
                            <SelectContent>
                              {SEVERITY_OPTIONS.map((severity) => (
                                <SelectItem key={severity} value={severity}>
                                  {titleCase(severity)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="findingDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value ?? ''} rows={3} placeholder="Describe the details of this finding..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <Button type="button" variant="secondary" className="self-start" onClick={() => setShowFinding(true)}>
                  Add a Finding
                </Button>
              )}
            </Panel>
          </form>
        </Form>

        <div className="mt-auto flex items-center justify-end gap-2 border-t pt-4">
          <Button type="button" variant="secondary" onClick={resetAndClose} disabled={pendingAction !== null}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={form.handleSubmit((data) => submit(data, ReviewReviewStatus.IN_PROGRESS))}
            loading={pendingAction === ReviewReviewStatus.IN_PROGRESS}
            disabled={pendingAction !== null}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit((data) => submit(data, ReviewReviewStatus.COMPLETED))}
            loading={pendingAction === ReviewReviewStatus.COMPLETED}
            disabled={pendingAction !== null}
          >
            Create Review
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default CreateControlReviewSheet
