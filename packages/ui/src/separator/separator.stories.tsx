import type { Meta, StoryObj } from '@storybook/react'
import { Separator } from './separator'

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  parameters: {
    docs: {
      description: {
        component: 'Separator component that can comprise of a line only or a line with text content',
      },
    },
  },
  render: ({ ...args }) => {
    return <Separator {...args} />
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const LineOnly: Story = {
  parameters: {
    backgrounds: { default: 'white' },
  },
}

export const WithLabel: Story = {
  parameters: {
    backgrounds: { default: 'white' },
  },
  args: {
    label: 'Label',
  },
}
