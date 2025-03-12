import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { format } from 'date-fns'
import { TCommentData } from '@/components/shared/comments/types/TCommentData'

type TProps = {
  comments: TCommentData[]
}

const CommentList: React.FC<TProps> = (props: TProps) => {
  return (
    <>
      {props.comments.map((item, index) => (
        <div className="w-full p-2" key={`${item.userName}-${index}`}>
          <div className="flex">
            <div className="w-1/10 flex justify-center">
              <Avatar variant="medium" className="relative flex shrink-0 overflow-hidden rounded-full p-0 h-10 w-10">
                {item?.avatarUrl && <AvatarImage src={item.avatarUrl} />}
                <AvatarFallback>{item.userName?.substring(0, 2)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="w-9/10 pl-3 w-full">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{item.userName}</p>
                <p className="text-sm">{format(new Date(item.createdAt), 'MMMM dd, yyyy - hh:mm a')}</p>
              </div>
              <div className="border rounded-lg p-3 mt-2 w-full">
                <p>{item.comment}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default CommentList
