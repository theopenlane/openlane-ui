import React from 'react'

interface PercentageDonutProps {
  value: number
  total: number
  size?: number
  thickness?: number
}

export const PercentageDonut: React.FC<PercentageDonutProps> = ({ value, total, size = 57, thickness = 8 }) => {
  const percentage = total === 0 ? 0 : (value / total) * 100

  const donutSize = `${size}px`
  const innerSize = `${size - thickness * 2}px`

  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: donutSize,
        height: donutSize,
        background: `conic-gradient(#22C55E ${percentage}%, #1E293B ${percentage}% 100%)`, // green / slate-800
      }}
    >
      <div
        className="bg-dark text-muted-foreground text-sm rounded-full flex items-center justify-center"
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
