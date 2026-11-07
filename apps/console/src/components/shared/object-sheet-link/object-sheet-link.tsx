'use client'

import React from 'react'
import Link from 'next/link'
import { type ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { isModifiedClick } from '@/utils/mouse-event'

type TObjectSheetLinkProps = {
  id: string
  kind: ObjectAssociationNodeEnum
  label: string
  onOpenSheet: (id: string, kind: ObjectAssociationNodeEnum) => void
}

const linkStyles = 'text-blue-500 hover:underline cursor-pointer'

const ObjectSheetLink: React.FC<TObjectSheetLinkProps> = ({ id, kind, label, onOpenSheet }) => {
  const href = getHrefForObjectType(kind, { id })

  if (!href) {
    return (
      <button type="button" onClick={() => onOpenSheet(id, kind)} className={`${linkStyles} bg-transparent border-0 p-0`}>
        {label}
      </button>
    )
  }

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isModifiedClick(event)) {
      return
    }

    event.preventDefault()
    onOpenSheet(id, kind)
  }

  return (
    <Link href={href} prefetch={false} onClick={handleClick} className={linkStyles}>
      {label}
    </Link>
  )
}

export default ObjectSheetLink
