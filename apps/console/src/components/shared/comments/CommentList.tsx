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
          <div className="flex items-start space-x-3">
            <Avatar variant="medium" className="relative flex shrink-0 overflow-hidden rounded-full p-0 h-10 w-10 mr-2">
              {item?.avatarUrl && <AvatarImage src={item.avatarUrl} />}
              <AvatarFallback>{item.userName?.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col w-full">
              <div className="flex items-baseline space-x-2">
                <p className="font-semibold leading-none mb-0">{item.userName}</p>
                <p className="text-sm text-gray-500">{format(new Date(item.createdAt), 'MMMM dd, yyyy - hh:mm a')}</p>
              </div>
              <p className="mt-1 border rounded-lg p-3">{item.comment}</p>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default CommentList
