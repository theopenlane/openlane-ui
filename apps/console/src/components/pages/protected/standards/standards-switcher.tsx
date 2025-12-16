'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import StandardsPage from './standards-page'
import { StandardsSwitcherEnum } from './shared/standard-switcher-config'
import MyFrameworks from './my-frameworks'
import { useGetStandards } from '@/lib/graphql-hooks/standards'
import { useOrganization } from '@/hooks/useOrganization'
import { useEffect } from 'react'

const StandardsSwitcher: React.FC = () => {
  const searchParams = useSearchParams()
  const { currentOrgId } = useOrganization()
  const page = searchParams.get('page')
  const router = useRouter()
  const { data, isLoading } = useGetStandards({
    where: {
      hasControlsWith: [
        {
          hasOwnerWith: [{ id: currentOrgId }],
        },
      ],
    },
  })
  const standardsData = data?.standards ?? null
  const loadMyFrameworks = page === StandardsSwitcherEnum.MY_FRAMEWORKS && (standardsData?.totalCount ?? 0) > 0

  useEffect(() => {
    if (!loadMyFrameworks && !isLoading) {
      const params = new URLSearchParams()
      params.set('page', 'standardsCatalog')

      router.replace(`/standards?${params.toString()}`)
    }
  }, [loadMyFrameworks, router, isLoading])

  return (
    <>
      {loadMyFrameworks && !isLoading && <MyFrameworks standardsData={standardsData?.edges} />}
      {!loadMyFrameworks && !isLoading && <StandardsPage />}
    </>
  )
}

export default StandardsSwitcher
