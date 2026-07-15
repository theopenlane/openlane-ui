'use client'

import { OverflowBadgesCell } from '@/components/shared/crud-base/columns/overflow-badges-cell'

type AdditionalRolesCellProps = {
  roles?: string[] | null
}

export const AdditionalRolesCell = ({ roles }: AdditionalRolesCellProps) => <OverflowBadgesCell values={roles} />
