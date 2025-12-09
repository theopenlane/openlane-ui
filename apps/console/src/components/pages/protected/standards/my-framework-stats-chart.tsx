import { GetStandardControlStatsQuery } from '@repo/codegen/src/schema'
import React from 'react'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis } from 'recharts'

type TMyFrameworksStatsChartProps = {
  data: GetStandardControlStatsQuery | undefined
}

const MyFrameworksStatsChart: React.FC<TMyFrameworksStatsChartProps> = ({ data }: TMyFrameworksStatsChartProps) => {
  if (!data) return null
  const covered = Number(data.standard.coveredControls.totalCount ?? 0)
  const automated = Number(data.standard.automatedControls.totalCount ?? 0)
  const total = data.standard.totalControlsSystemOwned ?? data.standard.totalControlsNonSystemOwned
  const finaltotal = Number(total?.totalCount)
  const remaining = Math.max(finaltotal - covered - automated, 0)

  const chartData = [{ name: 'Total', Coverage: covered, Uncovered: remaining }]

  const colors = ['var(--color-framework-coverage-covered)', 'var(--color-framework-coverage-uncovered)']
  const keys = ['Coverage', 'Uncovered']
  const percentages = {
    Coverage: ((covered / finaltotal) * 100).toFixed(0),
    Automated: ((automated / finaltotal) * 100).toFixed(0),
    Uncovered: ((remaining / finaltotal) * 100).toFixed(0),
  }

  const renderLegend = () => (
    <div className="flex justify-between mt-2">
      {keys.map((key) => (
        <div key={key} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-lg" style={{ backgroundColor: colors[keys.indexOf(key)] }}></span>
          <span className="text-sm">{key}</span>
          <span className="text-sm">{percentages[key as keyof typeof percentages]}%</span>
        </div>
      ))}
    </div>
  )
  return (
    <div className="overflow-hidden rounded-lg">
      <ResponsiveContainer width="100%" height={30}>
        <BarChart layout="vertical" data={chartData}>
          <XAxis type="number" hide domain={[0, finaltotal]} />
          <YAxis type="category" dataKey="name" hide />
          {keys.map((key, index) => {
            const value = chartData[0][key as keyof (typeof chartData)[0]] as number
            const previousValues = keys.slice(0, index).map((k) => chartData[0][k as keyof (typeof chartData)[0]] as number)
            const nextValues = keys.slice(index + 1).map((k) => chartData[0][k as keyof (typeof chartData)[0]] as number)
            const isFirstVisible = value > 0 && previousValues.every((v) => v === 0)
            const isLastVisible = value > 0 && nextValues.every((v) => v === 0)

            return <Bar key={key} dataKey={key} stackId="a" fill={colors[index]} height={8} radius={[isFirstVisible ? 8 : 0, isLastVisible ? 8 : 0, isLastVisible ? 8 : 0, isFirstVisible ? 8 : 0]} />
          })}
        </BarChart>
      </ResponsiveContainer>
      {renderLegend()}
    </div>
  )
}

export default MyFrameworksStatsChart
