import type { Meta, StoryObj } from '@storybook/react-vite'
import { Separator } from './separator'

const meta: Meta<typeof Separator> = {
  title: 'Layout/Separator',
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
  globals: {
    backgrounds: {
      value: 'white',
    },
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Label',
  },
  globals: {
    backgrounds: {
      value: 'white',
    },
  },
}
