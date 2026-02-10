import Image from 'next/image'
import { useEffect, useState } from 'react'

type Comment = {
  text: string
  avatarUrl: string
  author: string
  company: string
}

type DynamicCommentSectionProps = {
  comments: Comment[]
  intervalMs?: number
}

export default function CustomerQuoteSection({ comments, intervalMs = 3000 }: DynamicCommentSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (comments.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % comments.length)
    }, intervalMs)

    return () => clearInterval(interval)
  }, [comments, intervalMs])

  const current = comments[currentIndex]

  return (
    <div className="flex flex-col space-y-10 z-10 ">
      <span className="mb-0 wrap-break-words">“{current.text}”</span>

      <div className="flex items-center gap-4 mt-6">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-muted">
          <Image src={current.avatarUrl} alt={current.author} width={48} height={48} className="object-cover" />
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-sm text-foreground">{current.author}</span>
          <span className="text-sm text-muted-foreground font-normal">{current.company}</span>
        </div>
      </div>
    </div>
  )
}
