import type { Meta, StoryObj } from '@storybook/react-vite'
import { LineChart } from './chart'
import { LineChartExample } from './chart-example'

const meta: Meta<typeof LineChart> = {
  title: 'Data/LineChart',
  component: LineChart,
  parameters: {
    docs: {
      description: {
        component: 'A line chart component from tremor (https://tremor.so/docs/visualizations/line-chart)',
      },
    },
  },
} satisfies Meta<typeof LineChart>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="p-8 rounded-lg">
      <LineChartExample />
    </div>
  ),
}
