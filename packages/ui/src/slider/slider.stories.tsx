import type { Meta, StoryObj } from '@storybook/react'
import { Slider } from './slider'

const meta: Meta<typeof Slider> = {
  title: 'UI/Slider',
  component: Slider,
  parameters: {
    docs: {
      description: {
        component:
          'A slider component for selecting a value from a range. https://ui.shadcn.com/docs/components/slider',
      },
    },
  },
  render: (args) => <Slider {...args} />,
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: [50],
    step: 1,
  },
}

export const CustomRange: Story = {
  args: {
    min: 0,
    max: 200,
    defaultValue: [100],
    step: 5,
  },
}

export const Disabled: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: [50],
    step: 1,
    disabled: true,
  },
}
