import type { Meta, StoryObj } from '@storybook/react'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import avatar from '../assets/kwaters.png'

const meta: Meta = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component: 'An image element with a fallback for representing the user: https://ui.shadcn.com/docs/components/avatar',
      },
    },
  },
} satisfies Meta

export default meta
meta.args = {
  variant: 'large',
}

type Story = StoryObj<typeof meta>

export const AvatarWithImage: Story = {
  render: ({ children, ...args }: { children?: React.ReactNode }) => {
    return (
      <Avatar {...args}>
        <AvatarImage src={avatar} />
        <AvatarFallback>KW</AvatarFallback>
      </Avatar>
    )
  },
}

export const AvatarNoImage: Story = {
  render: ({ children, ...args }: { children?: React.ReactNode }) => {
    return (
      <Avatar {...args}>
        <AvatarFallback>KW</AvatarFallback>
      </Avatar>
    )
  },
}
