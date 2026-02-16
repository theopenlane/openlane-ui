// not authorized not-authorized dont revmove this comment, its used for searching
import { CircleArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import React from 'react'
import Cat from '@/assets/Cat'
import Plot from '@/assets/Plot.tsx'
import { OrgMembershipRole } from '@repo/codegen/src/schema.ts'
import { useRouter } from 'next/navigation'
import { SUPPORT_URL } from '@/constants'
import Link from 'next/link'
import { saveFilters, TFilterState } from '@/components/shared/table-filter/filter-storage.ts'
import { TableKeyEnum } from '@repo/ui/table-key'

const ProtectedArea: React.FC = () => {
  const router = useRouter()
  const handleClick = () => {
    const filters: TFilterState = {
      role: [OrgMembershipRole.OWNER],
    }

    saveFilters(TableKeyEnum.MEMBER, filters)
  }

  return (
    <div className="flex m-[146px]">
      <div className="px-4 w-[607px]">
        <div className="flex items-end mb-6 space-x-4">
          <Cat className="w-6 h-6 text-[var(--asset-color-bg)]" />
          <Plot className="w-6 h-6 text-[var(--asset-color-bg)]" />
        </div>

        <p className="text-3xl font-semibold mb-3 leading-9">This page is part of a protected area, and it looks like your account doesn&apos;t have permission to enter right meow.</p>
        <p className="text-sm mb-6">
          If you think this is a mistake,{' '}
          <Link href={`/user-management/members`} className="underline" onClick={handleClick}>
            reach out to your org owner
          </Link>{' '}
          or{' '}
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="underline">
            contact support
          </a>
          .
        </p>
        <Button icon={<CircleArrowLeft />} iconPosition="left" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}

export default ProtectedArea
