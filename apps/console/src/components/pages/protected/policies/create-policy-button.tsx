'use client'

import React from 'react'
import Link from 'next/link'
import { SquarePlus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useSession } from 'next-auth/react'

const CreatePolicyButton: React.FC = () => {
  const { data: permission } = useOrganizationRoles()
  const { data: session } = useSession()

  if (!hasPermission(permission?.roles, AccessEnum.CanCreateInternalPolicy, session)) {
    return null
  }

  return (
    <Button asChild variant="primary" className="h-8 px-2! pl-3!" icon={<SquarePlus />} iconPosition="left" aria-label="Create policy">
      <Link href="/policies/create">Create</Link>
    </Button>
  )
}

export default CreatePolicyButton
