"use client"

import { Meta, StoryObj } from "@storybook/react"
import { LineChart, TooltipProps } from "./chart"
import { cn } from "@repo/ui/lib/utils"
import { LineChartExample } from "./chart-example"

const meta: Meta<typeof LineChart> = {
    title: 'UI/LineChart',
    component: LineChart,
    parameters: {
        docs: {
            description: {
                component:
                    'A line chart component from tremor (https://tremor.so/docs/visualizations/line-chart)',
            },
        },
    },
} satisfies Meta<typeof LineChart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    render: () => (
        <div className='p-8 bg-white rounded-lg'>
            <LineChartExample />
        </div>
    ),
}

