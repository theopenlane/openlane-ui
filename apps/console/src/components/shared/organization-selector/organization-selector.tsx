'use client'

import { useState } from 'react'
import { organizationSelectorStyles } from './organization-selector.styles'
import { useGetAllOrganizationsQuery } from '@repo/codegen/src/schema'
import { Logo } from '@repo/ui/logo'
import { Button } from '@repo/ui/button'
import { ArrowRight, SearchIcon } from 'lucide-react'
import { ChevronDown } from '@repo/ui/icons/chevron-down'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Avatar, AvatarFallback } from '@repo/ui/avatar'
import { Input } from '@repo/ui/input'
import { Tag } from '@repo/ui/tag'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { switchOrganization } from '@/lib/user'

export const OrganizationSelector = () => {
  const { data: sessionData, update: updateSession } = useSession()
  const currentOrgId = sessionData?.user.organization
  const [organizationSearch, setOrganizationSearch] = useState('')
  const [allOrgs] = useGetAllOrganizationsQuery({ pause: !sessionData })

  const {
    container,
    logoWrapper,
    organizationLabel,
    organizationDropdown,
    allOrganizationsLink,
    popoverContent,
    searchWrapper,
    orgWrapper,
    orgInfo,
    orgTitle,
    orgSelect,
  } = organizationSelectorStyles()

  if (!allOrgs.data || allOrgs.fetching || allOrgs.error) {
    return <div></div>
  }

  const orgs = allOrgs.data.organizations.edges || []
  const filteredOrgs = orgs
    .filter((org) => {
      return (
        org?.node?.name.toLowerCase().includes(organizationSearch.toLowerCase()) &&
        org?.node?.id !== currentOrgId &&
        !org?.node?.personalOrg
      )
    })
    .slice(0, 4)

  const nonPersonalOrgs = orgs.filter((org) => !org?.node?.personalOrg)

  const activeOrg = orgs
    .filter((org) => org?.node?.id === currentOrgId)
    .map((org) => org?.node)[0]

  const handleOrganizationSwitch = async (orgId?: string) => {
    if (orgId) {
      const response = await switchOrganization({
        target_organization_id: orgId,
      })

      if (sessionData && response) {
        await updateSession({
          ...response.session,
          user: {
            ...sessionData.user,
            accessToken: response.access_token,
            organization: orgId,
            refreshToken: response.refresh_token,
          },
        })
      }
    }
  }

  // if there is only one non-personal organization, show the logo instead of the dropdown
  if (nonPersonalOrgs.length <= 1) {
    return (
      <Link href={'/'} className={logoWrapper()}>
        <Logo width={200} theme="light" />
      </Link>
    )
  }

  return (
    <div className={container()}>
      <Logo width={30} asIcon theme="javaLight" />
      <div>
        <div className={organizationLabel()}>Organization:</div>
        <Popover>
          <PopoverTrigger>
            <div className={organizationDropdown()}>
              <span>{activeOrg?.displayName}</span>
              <ChevronDown />
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className={popoverContent()}>
            <div className={searchWrapper()}>
              <Input
                value={organizationSearch}
                name="organization"
                placeholder="Search for a organization"
                onChange={(e) => {
                  setOrganizationSearch(e.currentTarget.value)
                }}
                icon={<SearchIcon width={17} />}
              />
            </div>
            {filteredOrgs.map((org) => {
              const role = org?.node?.members?.[0]?.role ?? 'Owner'

              return (
                <div key={org?.node?.id} className={`${orgWrapper()} group`}>
                  <div>
                    <Avatar>
                      <AvatarFallback>
                        {org?.node?.displayName.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className={orgInfo()}>
                    <div className={orgTitle()}>{org?.node?.displayName}</div>
                    <Tag>{role}</Tag>
                  </div>
                  <div className={orgSelect()}>
                    <Button
                      variant="aquamarine"
                      size="md"
                      onClick={() => handleOrganizationSwitch(org?.node?.id)}
                    >
                      Select
                    </Button>
                  </div>
                </div>
              )
            })}
            <div>
              <Link href="/organization" className={allOrganizationsLink()}>
                View all {orgs.length - 1} organizations
                <ArrowRight width={10} />
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
