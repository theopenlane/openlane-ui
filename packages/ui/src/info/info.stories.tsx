import type { Meta, StoryObj } from '@storybook/react'
import { Info } from './info'

const meta: Meta<typeof Info> = {
  title: 'UI/Info',
  component: Info,
  parameters: {
    docs: {
      description: {
        component: 'Info panel component',
      },
    },
    backgrounds: { default: 'white' },
  },
  render: (args) => {
    return <Info {...args} />
  },
} satisfies Meta<typeof Info>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Please use 32 characters at maximum.',
  },
}
