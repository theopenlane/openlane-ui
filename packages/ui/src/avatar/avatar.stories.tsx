import type { Meta, StoryObj } from '@storybook/react'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
const meta: Meta = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component:
          'An image element with a fallback for representing the user: https://ui.shadcn.com/docs/components/avatar',
      },
    },
    backgrounds: { default: 'white' },
  },
  render: ({ children, ...args }: { children: React.ReactNode }) => {
    return (
      <Avatar {...args}>
        <AvatarImage src="https://github.com/theopenlane.png" />
        <AvatarFallback>DT</AvatarFallback>
      </Avatar>
    )
  },
} satisfies Meta

export default meta
meta.args = {
  src: 'Email',
  type: 'email',
}
type Story = StoryObj<typeof meta>

export const AvatarWithImage: Story = {}

export const AvatarNoImage: Story = {
  render: () => {
    return (
      <Avatar>
        <AvatarFallback>DT</AvatarFallback>
      </Avatar>
    )
  },
}
