'use client'
import { useSearchParams } from 'next/navigation'
import StandardsPage from './standards-page'
import { StandardsSwitcherEnum } from './shared/standard-switcher-config'
import MyFrameworks from './my-frameworks'
import { useGetStandards } from '@/lib/graphql-hooks/standards'
import { useOrganization } from '@/hooks/useOrganization'

const StandardsSwitcher: React.FC = () => {
  const searchParams = useSearchParams()
  const { currentOrgId } = useOrganization()
  const page = searchParams.get('page')
  const { data } = useGetStandards({
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
  return (
    <>
      {loadMyFrameworks && <MyFrameworks standardsData={standardsData?.edges} />}
      {!loadMyFrameworks && <StandardsPage />}
    </>
  )
}

export default StandardsSwitcher
