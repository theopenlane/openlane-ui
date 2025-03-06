'use client'

import { useEffect, useState } from 'react'
import { organizationSelectorStyles } from './organization-selector.styles'
import { Logo } from '@repo/ui/logo'
import { Button } from '@repo/ui/button'
import { ArrowRight, SearchIcon } from 'lucide-react'
import { ChevronDown } from '@repo/ui/icons/chevron-down'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Input } from '@repo/ui/input'
import { Tag } from '@repo/ui/tag'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { switchOrganization } from '@/lib/user'
import { Loading } from '../loading/loading'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetAllOrganizationsWithMembers } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'

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
  const { container, logoWrapper, organizationLabel, organizationDropdown, allOrganizationsLink, popoverContent, searchWrapper, orgWrapper, orgInfo, orgTitle, orgSelect } =
    organizationSelectorStyles()

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
    return (
      <div className={container()}>
        <Link href={'/'} className={logoWrapper()}>
          <Logo width={160} />
        </Link>
      </div>
    )
  }

  return (
    <div className={container()}>
      <Logo width={32} asIcon={true} />
      <div>
        <div className={organizationLabel()}>Organization</div>
        <Popover>
          <PopoverTrigger>
            <div className={organizationDropdown()}>
              <span>{currentOrg?.displayName}</span>
              <ChevronDown />
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
              />
            </div>
            {filteredOrgs.map((org) => {
              const role = org?.node?.members?.[0]?.role ?? 'Owner'
              const image = org?.node?.avatarFile?.presignedURL || org?.node?.avatarRemoteURL

              return (
                <div key={org?.node?.id} className={`${orgWrapper()} group`}>
                  <div>
                    <Avatar>
                      {image && <AvatarImage src={image} />}
                      <AvatarFallback>{org?.node?.displayName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className={orgInfo()}>
                    <div className={orgTitle()}>{org?.node?.displayName}</div>
                    <Tag>{role}</Tag>
                  </div>
                  <div className={orgSelect()}>
                    <Button variant="filled" size="md" onClick={() => handleOrganizationSwitch(org?.node?.id)}>
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
