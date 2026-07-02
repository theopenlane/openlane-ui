import { type ResolvedAuthor } from '@/lib/authors'

export type TCommentData = {
  author: ResolvedAuthor
  createdAt: string
  comment: string
  createdBy: string
  id: string
}
