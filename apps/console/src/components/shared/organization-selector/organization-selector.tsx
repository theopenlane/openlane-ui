'use client'

import { useEffect, useState } from 'react'
import { organizationSelectorStyles } from './organization-selector.styles'
import { Button } from '@repo/ui/button'
import { BriefcaseBusiness, Check, ChevronsUpDown, SearchIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Input } from '@repo/ui/input'
import { Tag } from '@repo/ui/tag'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { switchOrganization } from '@/lib/user'
import { Loading } from '../loading/loading'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetAllOrganizationsWithMembers } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'
import { Organization } from '@repo/codegen/src/schema'

export const OrganizationSelector = () => {
  const { data: sessionData, update: updateSession } = useSession()
  const queryClient = useQueryClient()
  const [orgData, setOrgData] = useState({
    organizationSearch: '',
    numberOfOrgs: 0,
    currentOrgName: '',
  })

  const { currentOrgId } = useOrganization()

  const { data } = useGetAllOrganizationsWithMembers()
  const orgs = data?.organizations?.edges ?? []
  const currentOrg = orgs.filter((org) => org?.node?.id === currentOrgId)[0]?.node
  const { container, organizationDropdown, allOrganizationsLink, popoverContent, searchWrapper } = organizationSelectorStyles()
  console.log(data)
  const filteredOrgs = orgs
    .filter((org) => {
      return org?.node?.name.toLowerCase().includes(orgData.organizationSearch.toLowerCase()) && org?.node?.id !== currentOrgId && !org?.node?.personalOrg
    })
    .slice(0, 4)

  const nonPersonalOrgs = orgs.filter((org) => !org?.node?.personalOrg)

  useEffect(() => {
    if (currentOrg) {
      setOrgData({
        organizationSearch: '',
        numberOfOrgs: nonPersonalOrgs.length,
        currentOrgName: currentOrg?.displayName ?? '',
      })
    }
  }, [currentOrg])

  const handleOrganizationSwitch = async (orgId?: string) => {
    if (orgId && orgId !== currentOrgId) {
      const response = await switchOrganization({
        target_organization_id: orgId,
      })

      if (sessionData && response) {
        await updateSession({
          ...response.session,
          user: {
            ...sessionData.user,
            accessToken: response.access_token,
            activeOrganizationId: orgId,
            refreshToken: response.refresh_token,
          },
        })

        requestAnimationFrame(() => {
          queryClient?.invalidateQueries()
        })
      }
    }
  }

  if (!orgs) return <Loading />

  if (orgs.length < 2) {
    return null
    // <div className={container()}>
    //   <Link href={'/'} className={logoWrapper()}>
    //     <Logo width={160} />
    //   </Link>
    // </div>
  }

  return (
    <div className={container()}>
      <div>
        <Popover>
          <PopoverTrigger>
            <div className={organizationDropdown()}>
              <span className="truncate">{currentOrg?.displayName}</span>
              <ChevronsUpDown className="shrink-0" size={12} />
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className={popoverContent()}>
            <div className={searchWrapper()}>
              <Input
                value={orgData.organizationSearch}
                name="organization"
                placeholder="Search for a organization"
                onChange={(e) => {
                  setOrgData({
                    organizationSearch: e.currentTarget.value,
                    numberOfOrgs: nonPersonalOrgs.length,
                    currentOrgName: currentOrg?.displayName ?? '',
                  })
                }}
                icon={<SearchIcon width={17} />}
                iconPosition="left"
              />
            </div>
            <div className="border-t border-boder my-2.5"></div>
            {currentOrg?.name.includes(orgData.organizationSearch) && (
              <OrganizationItem
                org={currentOrg as Organization}
                isCurrent={true}
                role={currentOrg?.members?.edges?.[0]?.node?.role ?? 'Owner'}
                onClick={() => handleOrganizationSwitch(currentOrg?.id)}
              />
            )}

            {filteredOrgs.map((org) => (
              <OrganizationItem
                key={org?.node?.id}
                org={org?.node as Organization}
                isCurrent={false}
                role={org?.node?.members?.edges?.[0]?.node?.role ?? 'Owner'}
                onClick={() => handleOrganizationSwitch(org?.node?.id)}
              />
            ))}
            <div className="border-t border-boder my-2.5"></div>

            <div>
              <Link href="/organization" className={allOrganizationsLink()}>
                <Button className="w-full" icon={<BriefcaseBusiness size={16} />} iconPosition="left">
                  View all organizations
                </Button>
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

const OrganizationItem = ({ org, isCurrent, role, onClick }: { org: Organization; isCurrent: boolean; role: string; onClick: () => void }) => {
  const { orgWrapper, orgInfo, orgTitle } = organizationSelectorStyles()

  return (
    <div key={org.id} className={`${orgWrapper()} group`} onClick={onClick}>
      <div className={orgInfo()}>
        {isCurrent ? <Check size={16} /> : <Check size={16} className="opacity-0" />}
        <div className={orgTitle()}>{org.displayName}</div>
        <Tag className="bg-transparent capitalize px-1.5 border rounded-lg text-sm">{role.toLowerCase()}</Tag>
      </div>
    </div>
  )
}
