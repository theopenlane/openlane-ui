import { useGetStandardControlStats } from '@/lib/graphql-hooks/standards'
import React from 'react'

type TMyFrameworksStatsProps = {
  standardId: string
  isSystemOwned?: boolean | null | undefined
}

const MyFrameworksStats: React.FC<TMyFrameworksStatsProps> = ({ standardId, isSystemOwned }: TMyFrameworksStatsProps) => {
  const { data } = useGetStandardControlStats(standardId, isSystemOwned!)
  const covered = data?.standard.coveredControls
  const automated = data?.standard.automatedControls
  const total = data?.standard.totalControlsSystemOwned ?? data?.standard.totalControlsNonSystemOwned
  console.log('covered', covered)
  console.log('total', total)
  console.log('automated', automated)
  return <></>
}

export default MyFrameworksStats
