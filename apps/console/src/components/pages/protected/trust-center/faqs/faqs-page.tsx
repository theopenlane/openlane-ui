'use client'

import React, { use, useEffect, useState } from 'react'
import { isEmptyInputValue, omit, orClear, useDirtyInput, type TFieldMappers } from '@/hooks/useDirtyInput'
import useFormSchema from './hooks/use-form-schema'
import { CircleHelp, Upload } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import {
  useTrustCenterFaqsWithFilter,
  useCreateTrustCenterFaq,
  useUpdateTrustCenterFaq,
  useUpdateTrustCenterFaqComment,
  useDeleteTrustCenterFaq,
  useReorderTrustCenterFaqs,
  type TrustCenterFaqsNodeNonNull,
} from '@/lib/graphql-hooks/trust-center-faq'
import { useQueryClient } from '@tanstack/react-query'
import { type TrustCenterFaQsWithFilterQuery, type UpdateNoteInput, type UpdateTrustCenterFaqInput, OrderDirection, TrustCenterFaqOrderField } from '@repo/codegen/src/schema'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import type { FaqFormValues } from './hooks/use-form-schema'
import { CreateFaqForm } from './create-faq-form'
import { SortableFaqCard } from './sortable-faq-card'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit, hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useSession } from 'next-auth/react'
import { IMPORT_ROUTES } from '@/components/shared/record-import/lib/import-routes'
import { useOpenImport } from '@/components/shared/record-import/lib/use-open-import'

const FAQ_COMMENT_UPDATE_FIELDS = {
  question: (title) => ({ title }),
  answer: (text) => ({ text }),
  referenceLink: omit,
  category: omit,
} satisfies TFieldMappers<FaqFormValues, UpdateNoteInput>

const faqCategoryInput = (category: string | undefined): UpdateTrustCenterFaqInput =>
  category ? { trustCenterFaqKindName: category } : { clearTrustCenterFaqKindName: true, clearTrustCenterFaqKind: true }

const FAQ_UPDATE_FIELDS = {
  question: omit,
  answer: omit,
  referenceLink: orClear('clearReferenceLink'),
  category: faqCategoryInput,
} satisfies TFieldMappers<FaqFormValues, UpdateTrustCenterFaqInput>

const trustCenterFaqRefreshInput = ({ referenceLink, category }: FaqFormValues): UpdateTrustCenterFaqInput => ({
  ...(referenceLink && !isEmptyInputValue(referenceLink) ? { referenceLink } : { clearReferenceLink: true }),
  ...faqCategoryInput(category),
})

export default function FaqsPage() {
  const { setCrumbs } = use(BreadcrumbContext)
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null)
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const openImport = useOpenImport()
  const { successNotification, errorNotification } = useNotification()
  const { data: trustCenterData } = useGetTrustCenter()
  const trustCenterID = trustCenterData?.trustCenters?.edges?.[0]?.node?.id ?? ''
  const { data: tcPermission } = useAccountRoles(ObjectTypes.TRUST_CENTER, trustCenterID)
  const { data: session } = useSession()
  const canEditTc = canEdit(tcPermission?.roles, session)
  const { data: orgPermission } = useOrganizationRoles()
  const canCreateCategory = hasPermission(orgPermission?.roles, AccessEnum.CanCreateCustomTypeEnum, session)

  const { trustCenterFaqsNodes } = useTrustCenterFaqsWithFilter({
    where: { hasTrustCenterWith: [{ id: trustCenterID }] },
    orderBy: [{ field: TrustCenterFaqOrderField.DISPLAY_ORDER, direction: OrderDirection.ASC }],
    enabled: !!trustCenterID,
  })

  const [dragOrderIds, setDragOrderIds] = useState<string[] | null>(null)

  const orderedFaqs = dragOrderIds ? dragOrderIds.map((id) => trustCenterFaqsNodes.find((f) => f.id === id)).filter((f): f is TrustCenterFaqsNodeNonNull => f != null) : trustCenterFaqsNodes

  const { mutateAsync: createFaq, isPending: isCreating } = useCreateTrustCenterFaq()
  const { mutateAsync: updateFaq } = useUpdateTrustCenterFaq()
  const { mutateAsync: updateFaqComment, isPending: isUpdating } = useUpdateTrustCenterFaqComment()
  const { mutateAsync: deleteFaq } = useDeleteTrustCenterFaq()
  const { mutateAsync: reorderFaqs } = useReorderTrustCenterFaqs()

  const { form: editForm } = useFormSchema()
  const buildDirtyEditInput = useDirtyInput(editForm)

  const handleCreateSubmit = async (values: FaqFormValues): Promise<boolean> => {
    const highestOrder = Math.max(0, ...orderedFaqs.map((f) => f.displayOrder ?? 0))
    try {
      await createFaq({
        input: {
          createNote: { title: values.question, text: values.answer },
          referenceLink: values.referenceLink || undefined,
          trustCenterFaqKindName: values.category || undefined,
          displayOrder: highestOrder + 1,
          trustCenterID,
          noteID: '',
        },
      })
      successNotification({ title: 'FAQ published', description: 'Your FAQ has been successfully posted.' })
      return true
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      return false
    }
  }

  const handleUpdateSubmit = async (values: FaqFormValues) => {
    if (!editingFaqId) return
    const faq = orderedFaqs.find((f) => f.id === editingFaqId)
    if (!faq) return

    try {
      const commentInput = await buildDirtyEditInput<UpdateNoteInput>(values, FAQ_COMMENT_UPDATE_FIELDS)

      if (Object.keys(commentInput).length > 0) {
        await updateFaqComment({ updateTrustCenterFAQCommentId: faq.noteID, input: commentInput })
      }

      const changedFaqInput = await buildDirtyEditInput<UpdateTrustCenterFaqInput>(values, FAQ_UPDATE_FIELDS)
      const faqInput = Object.keys(changedFaqInput).length === 0 && Object.keys(commentInput).length > 0 ? trustCenterFaqRefreshInput(values) : changedFaqInput

      if (Object.keys(faqInput).length > 0) {
        await updateFaq({ updateTrustCenterFAQId: editingFaqId, input: faqInput })
      }
      successNotification({ title: 'FAQ updated', description: 'The changes to your FAQ have been saved.' })
      setEditingFaqId(null)
      editForm.reset()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleDelete = async () => {
    if (!faqToDelete) return
    try {
      await deleteFaq({ deleteTrustCenterFAQId: faqToDelete })
      successNotification({ title: 'FAQ deleted', description: 'The FAQ has been removed.' })
      setFaqToDelete(null)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const startEditing = (faq: TrustCenterFaqsNodeNonNull) => {
    setEditingFaqId(faq.id)
    editForm.reset({
      question: faq.note.title ?? '',
      answer: faq.note.text,
      referenceLink: faq.referenceLink ?? '',
      category: faq.trustCenterFaqKindName ?? '',
    })
  }

  const cancelEditing = () => {
    setEditingFaqId(null)
    editForm.reset()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = orderedFaqs.findIndex((f) => f.id === active.id)
    const newIndex = orderedFaqs.findIndex((f) => f.id === over.id)

    const reorderedIds = arrayMove(
      orderedFaqs.map((f) => f.id),
      oldIndex,
      newIndex,
    )
    setDragOrderIds(reorderedIds)

    const reordered = reorderedIds.map((id) => orderedFaqs.find((f) => f.id === id)).filter((f): f is TrustCenterFaqsNodeNonNull => f != null)

    const orderMap = new Map(reordered.map((faq, index) => [faq.id, index + 1]))

    queryClient.setQueriesData<TrustCenterFaQsWithFilterQuery>({ queryKey: ['trustCenterFaqs'] }, (old) => {
      if (!old?.trustCenterFAQs?.edges) return old
      return {
        ...old,
        trustCenterFAQs: {
          ...old.trustCenterFAQs,
          edges: old.trustCenterFAQs.edges.map((edge) => {
            if (!edge?.node) return edge
            const newOrder = orderMap.get(edge.node.id)
            if (newOrder === undefined) return edge
            return { ...edge, node: { ...edge.node, displayOrder: newOrder } }
          }),
        },
      }
    })
    setDragOrderIds(null)

    const updates = reordered.map((faq, index) => ({ id: faq.id, displayOrder: index + 1 })).filter((item, index) => reordered[index].displayOrder !== item.displayOrder)

    if (updates.length > 0) {
      try {
        await reorderFaqs(updates)
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
        queryClient.invalidateQueries({ queryKey: ['trustCenterFaqs'] })
      }
    }
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Trust Center', href: '/trust-center/overview' },
      { label: 'FAQs', href: '/trust-center/faqs' },
    ])
  }, [setCrumbs])

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 min-h-screen text-foreground">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h1>
          <p className="text-xs text-muted-foreground">Drag and drop questions to control the display order in your Trust Center.</p>
        </div>
        <Button variant="secondary" icon={<Upload size={16} />} iconPosition="left" disabled={!canEditTc} onClick={() => openImport(IMPORT_ROUTES[ObjectTypes.TRUST_CENTER_FAQ])}>
          Bulk Upload
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreateFaqForm disabled={!!editingFaqId || !canEditTc} isCreating={isCreating} onSubmit={handleCreateSubmit} canCreateCategory={canCreateCategory} />

        <div className="relative min-h-100">
          {orderedFaqs.length === 0 ? (
            <div className="absolute inset-0 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-8">
              <CircleHelp size={24} className="mb-4 text-muted-foreground" />
              <h3 className="text-sm font-medium mb-1 text-foreground">No FAQs added yet</h3>
              <p className="text-sm text-muted-foreground">Add your first FAQ to see it here</p>
            </div>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={orderedFaqs.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4 overflow-y-auto max-h-175 pr-2">
                  {orderedFaqs.map((faq) => (
                    <SortableFaqCard
                      key={faq.id}
                      faq={faq}
                      isEditing={editingFaqId === faq.id}
                      editingId={editingFaqId}
                      onStartEdit={startEditing}
                      onDelete={setFaqToDelete}
                      editForm={editForm}
                      isUpdating={isUpdating}
                      onSaveEdit={editForm.handleSubmit(handleUpdateSubmit)}
                      onCancelEdit={cancelEditing}
                      canEdit={canEditTc}
                      canCreateCategory={canCreateCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={!!faqToDelete}
        onOpenChange={(open) => !open && setFaqToDelete(null)}
        onConfirm={handleDelete}
        title="Delete FAQ"
        description="Are you sure you want to delete this FAQ? This action cannot be undone."
      />
    </div>
  )
}
