import React, { useState } from 'react'
import { Paperclip, Smile } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { useSession } from 'next-auth/react'
import { useGetUserProfile } from '@/lib/graphql-hooks/user'
import EmojiPicker from '@/components/shared/emoji/EmojiPicker'
import { TComments } from '@/components/shared/comments/types/TComments'
import { Avatar } from '../avatar/avatar'
import { User } from '@repo/codegen/src/schema'

type TProps = {
  onSuccess: (data: TComments) => void
}

const AddComment: React.FC<TProps> = (props: TProps) => {
  const { data: session } = useSession()
  const [emojiIsOpen, setEmojiIsOpen] = useState<boolean>(false)
  const userId = session?.user.userId
  const { data } = useGetUserProfile(userId)

  const [comment, setComment] = useState<string>('')

  const handleSaveComment = () => {
    setComment('')
    props.onSuccess({
      comment,
      userId: 1,
    })
  }

  const handleEmojiSelect = (data: any) => {
    setComment((prev) => prev + data.native)
  }

  return (
    <React.Fragment>
      <div className="mt-auto w-full p-2">
        <div className="flex items-start space-x-3">
          <Avatar entity={data?.user as User} variant="medium" className="relative flex shrink-0 overflow-hidden rounded-full p-0 h-10 w-10" />
          <div className="flex-1 border rounded-lg p-2 w-full flex flex-col space-y-2">
            <Input
              variant="medium"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write comment..."
              className="appearance-none bg-transparent border-none outline-none w-full"
            />

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <EmojiPicker isOpen={emojiIsOpen} onSelect={handleEmojiSelect} onClose={() => setEmojiIsOpen(false)} />
                <Smile className="w-5 h-5 cursor-pointer" onClick={() => setEmojiIsOpen(true)} />
                <Paperclip className="w-5 h-5 cursor-pointer" />
              </div>
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
