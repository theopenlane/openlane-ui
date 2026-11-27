import React, { useRef, useState } from 'react'
import { Button } from '@theopenlane/ui/button'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user'
import { type TComments } from '@/components/shared/comments/types/TComments'
import { Avatar } from '../avatar/avatar'
import { type User } from '@repo/codegen/src/schema'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { type TElement, type Value } from 'platejs'
import { CommentFilePicker } from './comment-file-picker'

type TProps = {
  onSuccess: (data: TComments) => Promise<void> | void
  canAttachFiles?: boolean
}

const AddComment: React.FC<TProps> = ({ onSuccess, canAttachFiles = false }) => {
  const { data: session } = useSession()
  const [clearData, setClearData] = useState<boolean>(false)
  const userId = session?.user?.userId
  const { data } = useGetCurrentUser(userId)
  const [comment, setComment] = useState<Value>([])
  const [files, setFiles] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const inFlightRef = useRef(false)

  const handleSaveComment = async () => {
    if (!comment || comment.length === 0 || inFlightRef.current) {
      return
    }
    inFlightRef.current = true
    setIsSaving(true)
    try {
      await onSuccess({
        comment,
        files,
      })
      setComment([])
      setFiles([])
      setClearData(true)
    } catch {
      return
    } finally {
      inFlightRef.current = false
      setIsSaving(false)
    }
  }

  const handleDetailsChange = (value: Value) => {
    setComment(value)
  }

  const isCommentEmpty = (value?: TElement[]) => {
    if (!value || value.length === 0) return true

    return value.every((node) => !node.children || node.children.every((child) => typeof child.text !== 'string' || child.text.trim() === ''))
  }

  return (
    <React.Fragment>
      <div className="mt-auto w-full p-2">
        <div className="flex items-start space-x-3 overflow-auto">
          <Avatar entity={data?.user as User} variant="medium" className="relative flex shrink-0 overflow-hidden rounded-full p-0 h-10 w-10" />
          <div className="flex-1 border rounded-lg p-2 w-full min-w-0 flex flex-col space-y-2">
            <PlateEditor onChange={handleDetailsChange} variant="minimal" styleVariant="comment" clearData={clearData} onClear={() => setClearData(false)} placeholder="Add a comment" />
            <div className="flex items-end gap-2">
              {canAttachFiles && <CommentFilePicker files={files} onChange={setFiles} disabled={isSaving} />}
              <Button className="ml-auto" disabled={isSaving || isCommentEmpty(comment)} type="button" iconPosition="left" onClick={() => handleSaveComment()}>
                {isSaving ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}

export default AddComment
