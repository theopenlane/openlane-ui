import React, { type ReactNode } from 'react'
import Cat from '@/assets/Cat'
import Plot from '@/assets/Plot.tsx'

type TLockedScreenProps = {
  heading: string
  description: ReactNode
  action: ReactNode
}

const LockedScreen: React.FC<TLockedScreenProps> = ({ heading, description, action }) => {
  return (
    <div className="mx-6 md:mx-[146px] my-[146px] px-4 max-w-[607px]">
      <div className="flex items-end mb-6 space-x-4">
        <Cat className="w-6 h-6 text-[var(--asset-color-bg)]" />
        <Plot className="w-6 h-6 text-[var(--asset-color-bg)]" />
      </div>

      <p className="text-3xl font-semibold mb-3 leading-9">{heading}</p>
      <p className="text-sm mb-6">{description}</p>
      {action}
    </div>
  )
}

export default LockedScreen
