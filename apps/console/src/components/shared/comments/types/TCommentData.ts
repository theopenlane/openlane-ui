import { type Value } from 'platejs'
import { type ResolvedAuthor } from '@/lib/authors'
import { type TCommentFile } from '@/lib/graphql-hooks/entity-comments'

export type TCommentData = {
  author: ResolvedAuthor
  createdAt: string
  comment: string | Value
  createdBy: string
  id: string
  files?: TCommentFile[]
}
