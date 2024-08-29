import type { Meta, StoryObj } from '@storybook/react'
import { Kbd } from './kbd'

const meta: Meta<typeof Kbd> = {
  title: 'UI/Kbd',
  component: Kbd,
  parameters: {
    docs: {
      description: {
        component: 'Keyboard input indicator',
      },
    },
  },
  render: (args) => {
    return <Kbd {...args} />
  },
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

export const MediumDefault: Story = {
  args: {
    text: '⌘',
  },
}

export const Small: Story = {
  args: {
    text: '⌘',
    size: 'small',
  },
}
