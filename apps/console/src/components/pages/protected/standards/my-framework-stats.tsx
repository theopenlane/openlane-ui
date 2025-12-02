import React from 'react'

type TMyFrameworksStatsProps = {
  standardId: string
  isSystemOwned: boolean
}

const MyFrameworksStats: React.FC<TMyFrameworksStatsProps> = ({ standardId, isSystemOwned }: TMyFrameworksStatsProps) => {
  console.log(standardId, isSystemOwned)
  return <></>
}

export default MyFrameworksStats
