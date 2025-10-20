'use client'

import React from 'react'
import clsx from 'clsx'

interface ProgressBarProps {
  percentage: number
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  const value = Math.min(Math.max(percentage, 0), 100)

  let wrapperColor = 'bg-slate-800'
  let fillColor = 'bg-emerald-500'

  if (value <= 25) {
    wrapperColor = 'bg-orange-800'
    fillColor = 'bg-orange-600'
  } else if (value <= 50) {
    wrapperColor = 'bg-yellow-800'
    fillColor = 'bg-yellow-600'
  } else if (value <= 75) {
    wrapperColor = 'bg-green-800'
    fillColor = 'bg-primary'
  } else {
    wrapperColor = 'bg-green-800'
    fillColor = 'bg-green-600'
  }

  return (
    <div className={clsx('flex-1 h-1 rounded-full overflow-hidden', wrapperColor)}>
      <div className={clsx('h-full rounded-full transition-all duration-500 ease-in-out', fillColor)} style={{ width: `${value}%` }} />
    </div>
  )
}

export default ProgressBar
