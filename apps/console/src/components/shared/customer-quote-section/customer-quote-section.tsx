import Image from 'next/image'

type Comment = {
  text: string
  avatarUrl: string
  author: string
  company: string
}

export default function CustomerQuoteSection({ comment }: { comment: Comment }) {
  return (
    <div className="flex flex-col space-y-10 z-10 ">
      <span className="mb-0 wrap-break-words">“{comment.text}”</span>

      <div className="flex items-center gap-4 mt-6">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-muted">
          <Image src={comment.avatarUrl} alt={comment.author} width={48} height={48} className="object-cover" />
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-sm text-foreground">{comment.author}</span>
          <span className="text-sm text-muted-foreground font-normal">{comment.company}</span>
        </div>
      </div>
    </div>
  )
}
