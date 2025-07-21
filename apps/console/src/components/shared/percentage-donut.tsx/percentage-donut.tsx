import React from 'react'
import { useTheme } from 'next-themes'

interface PercentageDonutProps {
  value: number
  total: number
  size?: number
  thickness?: number
}

export const PercentageDonut: React.FC<PercentageDonutProps> = ({ value, total, size = 57, thickness = 8 }) => {
  const { resolvedTheme } = useTheme()
  const percentage = total === 0 ? 0 : (value / total) * 100
  const donutSize = `${size}px`
  const innerSize = `${size - thickness * 2}px`

  const fillColor = percentage <= 30 ? 'rgba(222, 74, 74, 1)' : 'rgba(74, 222, 128, 1)'
  const trackColor = resolvedTheme === 'dark' ? 'rgba(55, 74, 82, 1)' : 'rgba(218, 227, 231, 1)'

  return (
    <div
      className="relative rounded-full"
      style={{
        width: donutSize,
        height: donutSize,
        background: `conic-gradient(${fillColor} ${percentage}%, ${trackColor} ${percentage}% 100%)`,
      }}
    >
      <div
        className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] bg-[--color-bg] text-sm rounded-full flex items-center justify-center"
        style={{
          width: innerSize,
          height: innerSize,
        }}
      >
        {Math.round(percentage)}%
      </div>
    </div>
  )
}
