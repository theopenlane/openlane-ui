import { CircleArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import React from 'react'
import Cat from '@/assets/Cat'
import Plot from '@/assets/Plot.tsx'
import { useSession } from 'next-auth/react'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization.ts'
import { OrgMembershipRole } from '@repo/codegen/src/schema.ts'
import { useRouter } from 'next/navigation'

const ProtectedArea: React.FC = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })
  const ownerEmail = membersData?.organization?.members?.edges?.find((item) => item?.node?.role === OrgMembershipRole.OWNER)?.node?.user?.email

  return (
    <div className="flex m-[146px]">
      <div className="px-4 w-[607px]">
        <div className="flex items-end mb-6 space-x-4">
          <Cat className="w-6 h-6 text-[var(--asset-color-bg)]" />
          <Plot className="w-6 h-6 text-[var(--asset-color-bg)]" />
        </div>

        <p className="text-3xl font-semibold mb-3 leading-9">This page is part of a protected area, and it looks like your account doesn't have permission to enter right meow.</p>
        <p className="text-sm mb-6">
          If you think this is a mistake,{' '}
          <a href={`mailto:${ownerEmail}`} className="underline">
            reach out to your org owner
          </a>{' '}
          or{' '}
          <a href="mailto:support@theopenlane.io" className="underline">
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
