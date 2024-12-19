import type { Meta, StoryObj } from '@storybook/react'
import { Wizard } from './step'

const meta: Meta<typeof Wizard> = {
  title: 'UI/Wizard',
  component: Wizard,
  parameters: {
    docs: {
      description: {
        component:
          'A step-by-step wizard that guides the user through a process',
      },
    },
  },
  render: ({ ...args }) => {
    return <Wizard numSteps={0} {...args} />
  },
} satisfies Meta<typeof Wizard>

export default meta
type Story = StoryObj<typeof meta>

export const Example: Story = {
  args: {
    numSteps: 5,
  }
}
