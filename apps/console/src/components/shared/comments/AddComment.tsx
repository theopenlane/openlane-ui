import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { useSession } from 'next-auth/react'
import { useGetUserProfile } from '@/lib/graphql-hooks/user'
import { TComments } from '@/components/shared/comments/types/TComments'
import { Avatar } from '../avatar/avatar'
import { User } from '@repo/codegen/src/schema'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { Value } from '@udecode/plate-common'

type TProps = {
  onSuccess: (data: TComments) => void
}

const AddComment: React.FC<TProps> = (props: TProps) => {
  const { data: session } = useSession()
  const [clearData, setClearData] = useState<boolean>(false)
  const userId = session?.user.userId
  const { data } = useGetUserProfile(userId)
  const [comment, setComment] = useState<Value | null>(null)

  const handleSaveComment = () => {
    if (!comment) {
      return
    }
    setComment(null)
    setClearData(true)
    props.onSuccess({
      comment,
    })
  }

  const handleDetailsChange = (value: Value) => {
    setComment(value)
  }

  return (
    <React.Fragment>
      <div className="mt-auto w-full p-2">
        <div className="flex items-start space-x-3">
          <Avatar entity={data?.user as User} variant="medium" className="relative flex shrink-0 overflow-hidden rounded-full p-0 h-10 w-10" />
          <div className="flex-1 border rounded-lg p-2 w-full flex flex-col space-y-2">
            <PlateEditor onChange={handleDetailsChange} variant="minimal" styleVariant="comment" clearData={clearData} onClear={() => setClearData(false)} />
            <div className="flex justify-end items-center">
              <Button iconPosition="left" onClick={() => handleSaveComment()}>
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}

export default AddComment
