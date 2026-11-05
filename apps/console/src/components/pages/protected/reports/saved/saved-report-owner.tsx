'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { AuthorCell } from '@/components/shared/user-display/author-cell'
import type { AuthorMaps } from '@/lib/authors'
import type { TSavedReportNode } from '@/lib/graphql-hooks/report'
import { savedReportOwnerId } from '@/lib/report/saved-report'

type TSavedReportOwnerProps = {
  report: Pick<TSavedReportNode, 'reportOwnerID' | 'createdBy'>
  authorMaps: AuthorMaps
  className?: string
  avatarClassName?: string
}

export const SavedReportOwner: React.FC<TSavedReportOwnerProps> = ({ report, authorMaps, className, avatarClassName }) => {
  const { data: session } = useSession()
  const ownerId = savedReportOwnerId(report)

  if (ownerId === session?.user?.userId) return <span className={className}>Me</span>

  return <AuthorCell id={ownerId} emptyLabel="-" className={className} avatarClassName={avatarClassName} {...authorMaps} />
}
