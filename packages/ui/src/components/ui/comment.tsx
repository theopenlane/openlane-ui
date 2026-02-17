'use client'

import * as React from 'react'

import type { CreatePlateEditorOptions } from 'platejs/react'

import { getCommentKey, getDraftCommentKey } from '@platejs/comment'
import { CommentPlugin, useCommentId } from '@platejs/comment/react'
import { differenceInDays, differenceInHours, differenceInMinutes, format } from 'date-fns'
import { ArrowUpIcon, CheckIcon, MoreHorizontalIcon, PencilIcon, TrashIcon, XIcon } from 'lucide-react'
import { type Value, KEYS, nanoid, NodeApi } from 'platejs'
import { Plate, useEditorPlugin, useEditorRef, usePlateEditor, usePluginOption } from 'platejs/react'

import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar.tsx'
import { Button } from '@repo/ui/components/ui/button.tsx'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/components/ui/dropdown-menu.tsx'
import { cn } from '@repo/ui/lib/utils'
import { BasicMarksKit } from '@repo/ui/components/editor/plugins/basic-marks-kit.tsx'
import { type TDiscussion, discussionPlugin, CommentEntityType } from '@repo/ui/components/editor/plugins/discussion-kit.tsx'

import { Editor, EditorContainer } from './editor'
import { POLICY_DISCUSSION_QUERY_KEY, useInsertPolicyComment, useUpdateInternalPolicy, useUpdatePolicyComment } from 'console/src/lib/graphql-hooks/internal-policy'
import type { UpdateControlInput, UpdateInternalPolicyInput, UpdateNoteInput, UpdateProcedureInput, UpdateRiskInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema.ts'
import { PROCEDURE_DISCUSSION_QUERY_KEY, useInsertProcedureComment, useUpdateProcedure, useUpdateProcedureComment } from 'console/src/lib/graphql-hooks/procedure'
import { CONTROL_DISCUSSION_QUERY_KEY, useInsertControlPlateComment, useUpdateControl, useUpdateControlComment } from 'console/src/lib/graphql-hooks/control'
import { SUBCONTROL_DISCUSSION_QUERY_KEY, useInsertSubcontrolPlateComment, useUpdateSubcontrol, useUpdateSubcontrolComment } from 'console/src/lib/graphql-hooks/subcontrol'
import { RISK_DISCUSSION_QUERY_KEY, useInsertRiskComment, useUpdateRisk, useUpdateRiskComment } from 'console/src/lib/graphql-hooks/risk'
import { useQueryClient } from '@tanstack/react-query'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export interface TComment {
  id: string
  contentRich: Value
  createdAt: Date
  discussionId: string
  isEdited: boolean
  userId: string
}

export function Comment(props: {
  comment: TComment
  discussionLength: number
  editingId: string | null
  index: number
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>
  documentContent?: string
  showDocumentContent?: boolean
  onEditorClick?: () => void
}) {
  const { comment, discussionLength, documentContent, editingId, index, setEditingId, showDocumentContent = false, onEditorClick } = props

  const editor = useEditorRef()
  const userInfo = usePluginOption(discussionPlugin, 'user', comment.userId)
  const currentUserId = usePluginOption(discussionPlugin, 'currentUserId')
  const { mutateAsync: updateControlComment } = useUpdateControlComment()
  const { mutateAsync: updateSubcontrolComment } = useUpdateSubcontrolComment()
  const { mutateAsync: updatePolicyComment } = useUpdatePolicyComment()
  const { mutateAsync: updateProcedureComment } = useUpdateProcedureComment()
  const { mutateAsync: updateRiskComment } = useUpdateRiskComment()

  const entityType = usePluginOption(discussionPlugin, 'entityType') as CommentEntityType

  type EntityInputMap = {
    [ObjectTypes.CONTROL]: UpdateNoteInput
    [ObjectTypes.SUBCONTROL]: UpdateNoteInput
    [ObjectTypes.PROCEDURE]: UpdateNoteInput
    [ObjectTypes.INTERNAL_POLICY]: UpdateNoteInput
    [ObjectTypes.RISK]: UpdateNoteInput
  }

  type EntityIdKeyMap = {
    [ObjectTypes.CONTROL]: 'updateControlCommentId'
    [ObjectTypes.SUBCONTROL]: 'updateSubcontrolCommentId'
    [ObjectTypes.PROCEDURE]: 'updateProcedureCommentId'
    [ObjectTypes.INTERNAL_POLICY]: 'updateInternalPolicyCommentId'
    [ObjectTypes.RISK]: 'updateRiskCommentId'
  }

  type EntityType = keyof EntityInputMap
  type EntityInput<T extends EntityType> = EntityInputMap[T]
  type EntityIdKey<T extends EntityType> = EntityIdKeyMap[T]

  type EntityUpdateFn<T extends EntityType> = (
    args: { [K in EntityIdKey<T>]: string } & {
      input: EntityInput<T>
    },
  ) => Promise<unknown>

  const entityUpdateMap: { [K in EntityType]: EntityUpdateFn<K> } = {
    [ObjectTypes.CONTROL]: updateControlComment,
    [ObjectTypes.SUBCONTROL]: updateSubcontrolComment,
    [ObjectTypes.PROCEDURE]: updateProcedureComment,
    [ObjectTypes.INTERNAL_POLICY]: updatePolicyComment,
    [ObjectTypes.RISK]: updateRiskComment,
  }

  function getEntityUpdater<T extends EntityType>(type: T): EntityUpdateFn<T> {
    return entityUpdateMap[type]
  }

  const entityUpdate = getEntityUpdater(entityType)

  const resolveDiscussion = async (id: string) => {
    // NOTE: backend does not support resolving discussions; keep this local-only
    const updatedDiscussions = editor.getOption(discussionPlugin, 'discussions').map((discussion) => {
      if (discussion.id === id) {
        return { ...discussion, isResolved: true }
      }
      return discussion
    })

    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions)
  }

  const removeDiscussion = async (id: string) => {
    // NOTE: backend does not support deleting discussions specifically by ID; keeping this local-only
    const updatedDiscussions = editor.getOption(discussionPlugin, 'discussions').filter((discussion) => discussion.id !== id)

    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions)
  }

  const updateComment = async (input: { id: string; contentRich: Value; discussionId: string; isEdited: boolean }) => {
    const text = NodeApi.string({ children: input.contentRich, type: KEYS.p })

    const commentIdKeyMap = {
      [ObjectTypes.CONTROL]: 'updateControlCommentId',
      [ObjectTypes.SUBCONTROL]: 'updateSubcontrolCommentId',
      [ObjectTypes.PROCEDURE]: 'updateProcedureCommentId',
      [ObjectTypes.INTERNAL_POLICY]: 'updateInternalPolicyCommentId',
      [ObjectTypes.RISK]: 'updateRiskCommentId',
    } as const

    const noteInput: UpdateNoteInput = {
      text,
    }

    await entityUpdate({
      [commentIdKeyMap[entityType]]: comment.id,
      input: noteInput,
    } as {
      [K in (typeof commentIdKeyMap)[typeof entityType]]: string
    } & {
      input: UpdateNoteInput
    })

    const updatedDiscussions = editor.getOption(discussionPlugin, 'discussions').map((discussion) => {
      if (discussion.id === input.discussionId) {
        const updatedComments = discussion.comments.map((c) => {
          if (c.id === input.id) {
            return {
              ...c,
              contentRich: input.contentRich,
              isEdited: true,
              updatedAt: new Date(),
            }
          }
          return c
        })
        return { ...discussion, comments: updatedComments }
      }
      return discussion
    })

    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions)
  }

  const { tf } = useEditorPlugin(CommentPlugin)

  const isMyComment = currentUserId === comment.userId
  const initialValue = comment.contentRich

  const commentEditor = useCommentEditor(
    {
      id: comment.id,
      value: initialValue,
    },
    [initialValue],
  )

  const onCancel = () => {
    setEditingId(null)
    commentEditor.tf.replaceNodes(initialValue, {
      at: [],
      children: true,
    })
  }

  const onSave = () => {
    void updateComment({
      id: comment.id,
      contentRich: commentEditor.children,
      discussionId: comment.discussionId,
      isEdited: true,
    })
    setEditingId(null)
  }

  const onResolveComment = () => {
    void resolveDiscussion(comment.discussionId)
    tf.comment.unsetMark({ id: comment.discussionId })
  }

  const isFirst = index === 0
  const isLast = index === discussionLength - 1
  const isEditing = editingId && editingId === comment.id

  const [hovering, setHovering] = React.useState(false)
  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  return (
    <div onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <div className="relative flex items-center">
        <Avatar className="size-5">
          <AvatarImage alt={userInfo?.name} src={userInfo?.avatarUrl} />
          <AvatarFallback>{userInfo?.name?.[0]}</AvatarFallback>
        </Avatar>
        <h4 className="mx-2 text-sm leading-none font-semibold">{userInfo?.name}</h4>

        <div className="text-xs leading-none text-muted-foreground/80">
          <span className="mr-1">{formatCommentDate(new Date(comment.createdAt))}</span>
          {comment.isEdited && <span>(edited)</span>}
        </div>

        {isMyComment && (hovering || dropdownOpen) && (
          <div className="absolute top-0 right-0 flex space-x-1">
            {index === 0 && (
              <Button variant="ghost" className="h-6 p-1 text-muted-foreground" onClick={onResolveComment} type="button">
                <CheckIcon className="size-4" />
              </Button>
            )}

            <CommentMoreDropdown
              onCloseAutoFocus={() => {
                setTimeout(() => {
                  commentEditor.tf.focus({ edge: 'endEditor' })
                }, 0)
              }}
              onRemoveComment={() => {
                if (discussionLength === 1) {
                  tf.comment.unsetMark({ id: comment.discussionId })
                  void removeDiscussion(comment.discussionId)
                }
              }}
              comment={comment}
              dropdownOpen={dropdownOpen}
              setDropdownOpen={setDropdownOpen}
              setEditingId={setEditingId}
            />
          </div>
        )}
      </div>

      {isFirst && showDocumentContent && (
        <div className="text-subtle-foreground relative mt-1 flex pl-[32px] text-sm">
          {discussionLength > 1 && <div className="absolute top-[5px] left-3 h-full w-0.5 shrink-0 bg-muted" />}
          <div className="my-px w-0.5 shrink-0 bg-highlight" />
          {documentContent && <div className="ml-2">{documentContent}</div>}
        </div>
      )}

      <div className="relative my-1 pl-[26px]">
        {!isLast && <div className="absolute top-0 left-3 h-full w-0.5 shrink-0 bg-muted" />}
        <Plate readOnly={!isEditing} editor={commentEditor}>
          <EditorContainer variant="comment">
            <Editor variant="comment" className="w-auto grow" onClick={() => onEditorClick?.()} />

            {isEditing && (
              <div className="ml-auto flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-[28px]"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    void onCancel()
                  }}
                >
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-[50%] bg-primary/40">
                    <XIcon className="size-3 stroke-[3px] text-background" />
                  </div>
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    void onSave()
                  }}
                >
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-[50%] bg-brand">
                    <CheckIcon className="size-3 stroke-[3px] text-background" />
                  </div>
                </Button>
              </div>
            )}
          </EditorContainer>
        </Plate>
      </div>
    </div>
  )
}

function CommentMoreDropdown(props: {
  comment: TComment
  dropdownOpen: boolean
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>
  onCloseAutoFocus?: () => void
  onRemoveComment?: () => void
}) {
  const { comment, dropdownOpen, setDropdownOpen, setEditingId, onCloseAutoFocus, onRemoveComment } = props
  const { mutateAsync: updateInternalPolicy } = useUpdateInternalPolicy()
  const { mutateAsync: updateProcedure } = useUpdateProcedure()
  const { mutateAsync: updateControl } = useUpdateControl()
  const { mutateAsync: updateSubcontrol } = useUpdateSubcontrol()
  const { mutateAsync: updateRisk } = useUpdateRisk()
  const entityId = usePluginOption(discussionPlugin, 'entityId') as string
  const entityType = usePluginOption(discussionPlugin, 'entityType') as CommentEntityType

  type EntityInputMap = {
    Control: UpdateControlInput
    Subcontrol: UpdateSubcontrolInput
    Procedure: UpdateProcedureInput
    InternalPolicy: UpdateInternalPolicyInput
    Risk: UpdateRiskInput
  }

  type EntityIdKeyMap = {
    Control: 'updateControlId'
    Subcontrol: 'updateSubcontrolId'
    Procedure: 'updateProcedureId'
    InternalPolicy: 'updateInternalPolicyId'
    Risk: 'updateRiskId'
  }

  type EntityType = keyof EntityInputMap
  type EntityInput<T extends EntityType> = EntityInputMap[T]
  type EntityIdKey<T extends EntityType> = EntityIdKeyMap[T]

  type EntityUpdateFn<T extends EntityType> = (
    args: { [K in EntityIdKey<T>]: string } & {
      input: EntityInput<T>
    },
  ) => Promise<unknown>

  const entityUpdateMap: { [K in EntityType]: EntityUpdateFn<K> } = {
    Control: updateControl,
    Subcontrol: updateSubcontrol,
    Procedure: updateProcedure,
    InternalPolicy: updateInternalPolicy,
    Risk: updateRisk,
  }

  function getEntityUpdater<T extends EntityType>(type: T): EntityUpdateFn<T> {
    return entityUpdateMap[type]
  }

  const entityUpdate = getEntityUpdater(entityType)

  const editor = useEditorRef()

  const selectedEditCommentRef = React.useRef<boolean>(false)

  const onDeleteComment = React.useCallback(async () => {
    if (!comment.id) return alert('You are operating too quickly, please try again later.')

    const entityIdKeyMap: EntityIdKeyMap = {
      Control: 'updateControlId',
      Subcontrol: 'updateSubcontrolId',
      Procedure: 'updateProcedureId',
      InternalPolicy: 'updateInternalPolicyId',
      Risk: 'updateRiskId',
    }

    const input: EntityInput<typeof entityType> = {
      deleteComment: comment.id,
    }

    await entityUpdate({
      [entityIdKeyMap[entityType]]: entityId,
      input,
    } as {
      [K in EntityIdKey<typeof entityType>]: string
    } & {
      input: EntityInput<typeof entityType>
    })

    // Local-only delete; backend has no comment IDs in response
    const updatedDiscussions = editor.getOption(discussionPlugin, 'discussions').map((discussion) => {
      if (discussion.id !== comment.discussionId) {
        return discussion
      }

      const commentIndex = discussion.comments.findIndex((c) => c.id === comment.id)
      if (commentIndex === -1) {
        return discussion
      }

      return {
        ...discussion,
        comments: [...discussion.comments.slice(0, commentIndex), ...discussion.comments.slice(commentIndex + 1)],
      }
    })

    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions)
    onRemoveComment?.()
  }, [comment.discussionId, comment.id, editor, onRemoveComment])

  const onEditComment = React.useCallback(() => {
    selectedEditCommentRef.current = true

    if (!comment.id) return alert('You are operating too quickly, please try again later.')

    setEditingId(comment.id)
  }, [comment.id, setEditingId])

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" className={cn('h-6 p-1 text-muted-foreground')}>
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48"
        onCloseAutoFocus={(e) => {
          if (selectedEditCommentRef.current) {
            onCloseAutoFocus?.()
            selectedEditCommentRef.current = false
          }

          return e.preventDefault()
        }}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer" onClick={onEditComment}>
            <PencilIcon className="size-4" />
            Edit comment
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => void onDeleteComment()}>
            <TrashIcon className="size-4" />
            Delete comment
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const useCommentEditor = (options: Omit<CreatePlateEditorOptions, 'plugins'> = {}, deps: any[] = []) => {
  const commentEditor = usePlateEditor(
    {
      id: 'comment',
      plugins: BasicMarksKit,
      value: [],
      ...options,
    },
    deps,
  )

  return commentEditor
}

export function CommentCreateForm({
  autoFocus = false,
  className,
  discussionId: discussionIdProp,
  focusOnMount = false,
}: {
  autoFocus?: boolean
  className?: string
  discussionId?: string
  focusOnMount?: boolean
}) {
  const discussions = usePluginOption(discussionPlugin, 'discussions')
  const entityId = usePluginOption(discussionPlugin, 'entityId') as string
  const entityType = usePluginOption(discussionPlugin, 'entityType') as CommentEntityType

  const editor = useEditorRef()
  const commentId = useCommentId()
  const discussionId = discussionIdProp ?? commentId

  const userInfo = usePluginOption(discussionPlugin, 'currentUser')
  const [commentValue, setCommentValue] = React.useState<Value | undefined>()
  const commentContent = React.useMemo(() => (commentValue ? NodeApi.string({ children: commentValue, type: KEYS.p }) : ''), [commentValue])
  const commentEditor = useCommentEditor()
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
  const queryClient = useQueryClient()

  type EntityInputMap = {
    Control: UpdateControlInput
    Subcontrol: UpdateSubcontrolInput
    Procedure: UpdateProcedureInput
    InternalPolicy: UpdateInternalPolicyInput
    Risk: UpdateRiskInput
  }

  type EntityIdKeyMap = {
    Control: 'updateControlId'
    Subcontrol: 'updateSubcontrolId'
    Procedure: 'updateProcedureId'
    InternalPolicy: 'updateInternalPolicyId'
    Risk: 'updateRiskId'
  }

  type EntityType = keyof EntityInputMap
  type EntityInput<T extends EntityType> = EntityInputMap[T]
  type EntityIdKey<T extends EntityType> = EntityIdKeyMap[T]

  type EntityUpdateFn<T extends EntityType> = (
    args: { [K in EntityIdKey<T>]: string } & {
      input: EntityInput<T>
    },
  ) => Promise<unknown>

  const entityUpdateMap: { [K in EntityType]: EntityUpdateFn<K> } = {
    Control: insertControlComment,
    Subcontrol: insertSubcontrolComment,
    Procedure: insertProcedureComment,
    InternalPolicy: insertPolicyComment,
    Risk: insertRiskComment,
  }

  const entityDescriptionUpdateMap: { [K in EntityType]: EntityUpdateFn<K> } = {
    Control: updateControl,
    Subcontrol: updateSubcontrol,
    Procedure: updateProcedure,
    InternalPolicy: updateInternalPolicy,
    Risk: updateRisk,
  }

  const entityUpdate = getEntityUpdater(entityType)
  const entityDescriptionUpdate = getEntityDescriptionUpdater(entityType)

  function getEntityUpdater<T extends EntityType>(type: T): EntityUpdateFn<T> {
    return entityUpdateMap[type]
  }

  function getEntityDescriptionUpdater<T extends EntityType>(type: T): EntityUpdateFn<T> {
    return entityDescriptionUpdateMap[type]
  }

  const updateDescription = async () => {
    const entityIdKeyMap: EntityIdKeyMap = {
      Control: 'updateControlId',
      Subcontrol: 'updateSubcontrolId',
      Procedure: 'updateProcedureId',
      InternalPolicy: 'updateInternalPolicyId',
      Risk: 'updateRiskId',
    }

    const input = entityType === ObjectTypes.CONTROL || entityType === ObjectTypes.SUBCONTROL ? { descriptionJSON: editor.children } : { detailsJSON: editor.children }

    await entityDescriptionUpdate({
      [entityIdKeyMap[entityType]]: entityId,
      input,
    } as {
      [K in EntityIdKey<typeof entityType>]: string
    } & {
      input: EntityInput<typeof entityType>
    })

    let entityUpdateKey
    let entityDiscussionKey

    switch (entityType) {
      case ObjectTypes.CONTROL:
        entityUpdateKey = CONTROL_DISCUSSION_QUERY_KEY
        entityDiscussionKey = 'controls'
        break
      case ObjectTypes.RISK:
        entityUpdateKey = RISK_DISCUSSION_QUERY_KEY
        entityDiscussionKey = 'risks'
        break
      case ObjectTypes.INTERNAL_POLICY:
        entityUpdateKey = POLICY_DISCUSSION_QUERY_KEY
        entityDiscussionKey = 'internalPolicies'
        break
      case ObjectTypes.SUBCONTROL:
        entityUpdateKey = SUBCONTROL_DISCUSSION_QUERY_KEY
        entityDiscussionKey = 'subcontrols'
        break
      case ObjectTypes.PROCEDURE:
        entityUpdateKey = PROCEDURE_DISCUSSION_QUERY_KEY
        entityDiscussionKey = 'procedures'
        break
      default:
        entityUpdateKey = undefined
        entityDiscussionKey = undefined
    }

    if (entityUpdateKey && entityDiscussionKey) {
      queryClient.invalidateQueries({ queryKey: [entityUpdateKey, entityId] })
      queryClient.invalidateQueries({ queryKey: [entityDiscussionKey, entityId] })
    }
  }

  React.useEffect(() => {
    if (commentEditor && focusOnMount) {
      commentEditor.tf.focus()
    }
  }, [commentEditor, focusOnMount])

  const onAddComment = React.useCallback(async () => {
    if (!commentValue) return

    const entityIdKeyMap: EntityIdKeyMap = {
      Control: 'updateControlId',
      Subcontrol: 'updateSubcontrolId',
      Procedure: 'updateProcedureId',
      InternalPolicy: 'updateInternalPolicyId',
      Risk: 'updateRiskId',
    }

    const text = NodeApi.string({ children: commentValue, type: KEYS.p })

    commentEditor.tf.reset()

    if (discussionId) {
      // Get existing discussion
      const discussion = discussions.find((d) => d.id === discussionId)
      if (!discussion) {
        // Create new discussion locally
        const newDiscussion: TDiscussion = {
          id: discussionId,
          comments: [
            {
              id: nanoid(),
              contentRich: commentValue,
              createdAt: new Date(),
              discussionId,
              isEdited: false,
              userId: editor.getOption(discussionPlugin, 'currentUserId')!,
            },
          ],
          createdAt: new Date(),
          isResolved: false,
          userId: editor.getOption(discussionPlugin, 'currentUserId')!,
        }

        // 🔁 Sync with backend for NEW discussion only
        if (entityId) {
          const input: EntityInput<typeof entityType> = {
            addDiscussion: {
              externalID: discussionId,
              addComment: {
                text,
                noteRef: commentValue[0].id! as string,
              },
            },
          }

          await entityUpdate({
            [entityIdKeyMap[entityType]]: entityId,
            input,
          } as {
            [K in EntityIdKey<typeof entityType>]: string
          } & {
            input: EntityInput<typeof entityType>
          })

          const updatedDiscussions = [...discussions, newDiscussion]
          editor.setOption(discussionPlugin, 'discussions', updatedDiscussions)
        }

        return
      }

      const comment: TComment = {
        id: nanoid(),
        contentRich: commentValue,
        createdAt: new Date(),
        discussionId,
        isEdited: false,
        userId: editor.getOption(discussionPlugin, 'currentUserId')!,
      }

      const updatedDiscussion = {
        ...discussion,
        comments: [...discussion.comments, comment],
      }

      if (entityId) {
        const input: EntityInput<typeof entityType> = {
          updateDiscussion: {
            id: updatedDiscussion.systemId!,
            input: {
              addComment: {
                text,
                noteRef: commentValue[0].id! as string,
              },
            },
          },
        }

        const entityData = (await entityUpdate({
          [entityIdKeyMap[entityType]]: entityId,
          input,
        } as {
          [K in EntityIdKey<typeof entityType>]: string
        } & {
          input: EntityInput<typeof entityType>
        })) as Record<string, unknown>

        const mutationResult = Object.values(entityData)[0]
        const entityPayload = mutationResult && Object.values(mutationResult)[0]
        const discussion = entityPayload?.discussions?.edges[0].node

        const lastUpdatedComment = updatedDiscussion.comments[updatedDiscussion.comments.length - 1]
        const lastReturnedComment = discussion.comments.edges[discussion.comments.edges.length - 1]

        if (lastUpdatedComment && lastReturnedComment) {
          lastUpdatedComment.id = lastReturnedComment.node.id
        }
      }

      const updatedDiscussions = discussions.filter((d) => d.id !== discussionId).concat(updatedDiscussion)
      editor.setOption(discussionPlugin, 'discussions', updatedDiscussions)

      return
    }

    const commentsNodeEntry = editor.getApi(CommentPlugin).comment.nodes({ at: [], isDraft: true })

    if (commentsNodeEntry.length === 0) return

    const documentContent = commentsNodeEntry.map(([node]) => node.text).join('')

    const _discussionId = nanoid()
    // Create new discussion locally
    const newDiscussion: TDiscussion = {
      id: _discussionId,
      comments: [
        {
          id: nanoid(),
          contentRich: commentValue,
          createdAt: new Date(),
          discussionId: _discussionId,
          isEdited: false,
          userId: editor.getOption(discussionPlugin, 'currentUserId')!,
        },
      ],
      createdAt: new Date(),
      documentContent,
      isResolved: false,
      userId: editor.getOption(discussionPlugin, 'currentUserId')!,
    }

    const updatedDiscussions = [...discussions, newDiscussion]

    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions)

    const id = newDiscussion.id

    commentsNodeEntry.forEach(([, path]) => {
      editor.tf.setNodes(
        {
          [getCommentKey(id)]: true,
        },
        { at: path, split: true },
      )
      editor.tf.unsetNodes([getDraftCommentKey()], { at: path })
    })

    // 🔁 Sync with backend for NEW discussion only
    if (entityId) {
      const input: EntityInput<typeof entityType> = {
        addDiscussion: {
          externalID: id,
          addComment: {
            text,
            noteRef: commentValue[0].id! as string,
          },
        },
      }

      await entityUpdate({
        [entityIdKeyMap[entityType]]: entityId,
        input,
      } as {
        [K in EntityIdKey<typeof entityType>]: string
      } & {
        input: EntityInput<typeof entityType>
      })

      updateDescription()
    }
  }, [commentValue, commentEditor.tf, commentId, discussionId, discussions, editor, entityId])

  return (
    <div className={cn('flex w-full', className)} onClick={(e) => e.stopPropagation()}>
      <div className="mt-2 mr-1 shrink-0">
        <Avatar className="size-5">
          <AvatarImage alt={userInfo?.name} src={userInfo?.avatarUrl} />
          <AvatarFallback>{userInfo?.name?.[0]}</AvatarFallback>
        </Avatar>
      </div>

      <div className="relative flex grow gap-2">
        <Plate
          onChange={({ value }) => {
            setCommentValue(value)
          }}
          editor={commentEditor}
        >
          <EditorContainer variant="comment">
            <Editor
              variant="comment"
              className="min-h-[25px] grow pt-0.5 pr-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void onAddComment()
                }
              }}
              placeholder="Reply..."
              autoComplete="off"
              autoFocus={autoFocus}
            />

            <Button
              size="icon"
              variant="ghost"
              className="absolute right-0.5 bottom-0.5 ml-auto size-6 shrink-0"
              disabled={commentContent.trim().length === 0}
              onClick={(e) => {
                e.stopPropagation()
                void onAddComment()
              }}
            >
              <div className="flex size-6 items-center justify-center rounded-full">
                <ArrowUpIcon />
              </div>
            </Button>
          </EditorContainer>
        </Plate>
      </div>
    </div>
  )
}

export const formatCommentDate = (date: Date) => {
  const now = new Date()
  const diffMinutes = differenceInMinutes(now, date)
  const diffHours = differenceInHours(now, date)
  const diffDays = differenceInDays(now, date)

  if (diffMinutes < 60) {
    return `${diffMinutes}m`
  }
  if (diffHours < 24) {
    return `${diffHours}h`
  }
  if (diffDays < 2) {
    return `${diffDays}d`
  }

  return format(date, 'MM/dd/yyyy')
}
