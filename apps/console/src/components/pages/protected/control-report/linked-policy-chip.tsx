'use client'

import React from 'react'
import Link from 'next/link'

type LinkedPolicyChipProps = {
  id: string
  name: string
}

const LinkedPolicyChip: React.FC<LinkedPolicyChipProps> = ({ id, name }) => (
  <Link href={`/policies/${id}/view`} target="_blank" rel="noopener noreferrer" className="inline-block max-w-full truncate rounded bg-muted px-1.5 py-0.5 text-xs hover:bg-accent cursor-pointer">
    {name}
  </Link>
)

export default LinkedPolicyChip
