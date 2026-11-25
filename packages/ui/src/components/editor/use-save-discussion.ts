'use client'

import type { UpdateInternalPolicyInput } from '@repo/codegen/src/schema.ts'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { stripUnsavedCommentMarks } from '@repo/ui/components/editor/comment-utils.ts'
import { type CommentEntityType, discussionPlugin } from '@repo/ui/components/editor/plugins/discussion-kit.tsx'
import { serializeCommentValue } from '@repo/ui/components/editor/plugins/mention-serialize.ts'
import { useInsertControlPlateComment, useUpdateControl } from 'console/src/lib/graphql-hooks/control'
import { useInsertPolicyComment, useUpdateInternalPolicy } from 'console/src/lib/graphql-hooks/internal-policy'
import { useInsertProcedureComment, useUpdateProcedure } from 'console/src/lib/graphql-hooks/procedure'
import { useInsertRiskComment, useUpdateRisk } from 'console/src/lib/graphql-hooks/risk'
import { useInsertSubcontrolPlateComment, useUpdateSubcontrol } from 'console/src/lib/graphql-hooks/subcontrol'
import type { Value } from 'platejs'
import { useEditorRef } from 'platejs/react'

export type DiscussionInput = Pick<UpdateInternalPolicyInput, 'addDiscussion' | 'updateDiscussion'>

type EntityPersistence = {
  saveDiscussion: (id: string, input: DiscussionInput) => Promise<object>
  saveDocument: (id: string, document: Value) => Promise<object>
}

export const useSaveDiscussion = () => {
  const editor = useEditorRef()
  const { mutateAsync: insertPolicyComment } = useInsertPolicyComment()
  const { mutateAsync: insertProcedureComment } = useInsertProcedureComment()
  const { mutateAsync: insertControlComment } = useInsertControlPlateComment()
  const { mutateAsync: insertSubcontrolComment } = useInsertSubcontrolPlateComment()
  const { mutateAsync: insertRiskComment } = useInsertRiskComment()
  const { mutateAsync: updateInternalPolicy } = useUpdateInternalPolicy()
  const { mutateAsync: updateProcedure } = useUpdateProcedure()
  const { mutateAsync: updateControl } = useUpdateControl()
  const { mutateAsync: updateSubcontrol } = useUpdateSubcontrol()
  const { mutateAsync: updateRisk } = useUpdateRisk()

  const persistence: Record<CommentEntityType, EntityPersistence> = {
    [ObjectTypes.CONTROL]: {
      saveDiscussion: (id, input) => insertControlComment({ updateControlId: id, input }),
      saveDocument: (id, document) => updateControl({ updateControlId: id, input: { descriptionJSON: document } }),
    },
    [ObjectTypes.SUBCONTROL]: {
      saveDiscussion: (id, input) => insertSubcontrolComment({ updateSubcontrolId: id, input }),
      saveDocument: (id, document) => updateSubcontrol({ updateSubcontrolId: id, input: { descriptionJSON: document } }),
    },
    [ObjectTypes.PROCEDURE]: {
      saveDiscussion: (id, input) => insertProcedureComment({ updateProcedureId: id, input }),
      saveDocument: (id, document) => updateProcedure({ updateProcedureId: id, input: { detailsJSON: document } }),
    },
    [ObjectTypes.INTERNAL_POLICY]: {
      saveDiscussion: (id, input) => insertPolicyComment({ updateInternalPolicyId: id, input }),
      saveDocument: (id, document) => updateInternalPolicy({ updateInternalPolicyId: id, input: { detailsJSON: document } }),
    },
    [ObjectTypes.RISK]: {
      saveDiscussion: (id, input) => insertRiskComment({ updateRiskId: id, input }),
      saveDocument: (id, document) => updateRisk({ updateRiskId: id, input: { detailsJSON: document } }),
    },
  }

  const getTarget = () => {
    const { entityId, entityType } = editor.getOptions(discussionPlugin)
    return entityId && entityType ? { entityId, ...persistence[entityType] } : null
  }

  const saveDiscussion = async (input: DiscussionInput): Promise<object | undefined> => {
    const target = getTarget()
    return target?.saveDiscussion(target.entityId, input)
  }

  const saveDocument = async () => {
    const target = getTarget()
    if (!target) return

    await target.saveDocument(target.entityId, stripUnsavedCommentMarks(editor.children as Value, editor.getOption(discussionPlugin, 'pendingAiDiscussions')))
  }

  const addDiscussion = (externalID: string, contentRich: Value) =>
    saveDiscussion({ addDiscussion: { externalID, addComment: { text: serializeCommentValue(contentRich), noteRef: contentRich[0].id as string } } })

  return { addDiscussion, saveDiscussion, saveDocument }
}
