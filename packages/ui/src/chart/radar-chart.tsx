'use client'

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart as RechartsRadarChart, ResponsiveContainer, Tooltip } from 'recharts'

export type TRadarChartDatum = {
  axis: string
  value: number
  tooltip?: string
}

type RadarChartProps = {
  data: TRadarChartDatum[]
  color?: string
  height?: number
  ariaLabel?: string
}

type TRadarTooltipProps = {
  active?: boolean
  payload?: Array<{ payload?: TRadarChartDatum }>
}

const RadarTooltip = ({ active, payload }: TRadarTooltipProps) => {
  const datum = payload?.[0]?.payload
  if (!active || !datum) return null
  return <div className="rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm">{datum.tooltip ?? datum.axis}</div>
}

export const RadarChart = ({ data, color = 'var(--color-primary)', height = 260, ariaLabel }: RadarChartProps) => (
  <div style={{ width: '100%', height }} role="img" aria-label={ariaLabel}>
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--color-border)" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
        <Tooltip content={<RadarTooltip />} isAnimationActive={false} />
        <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.3} strokeWidth={2} dot={{ r: 3, fill: color }} isAnimationActive={false} />
      </RechartsRadarChart>
    </ResponsiveContainer>
  </div>
)
