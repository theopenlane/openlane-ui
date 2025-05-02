'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface DonutChartProps {
  data: { name: string; value: number }[]
  colors?: string[]
  innerRadius?: number
  outerRadius?: number
  width?: number
  height?: number
}

export function DonutChart({ data, colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'], innerRadius = 60, outerRadius = 80, width = 300, height = 300 }: DonutChartProps) {
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} dataKey="value">
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="none" strokeWidth={0} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
