import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRight, ArrowUpRight, Check, Copy, InfoIcon, Trash2, X } from 'lucide-react'
import { GoogleIcon } from '../icons/google'
import { Button, buttonStyles } from './button'

type ButtonVariants = keyof typeof buttonStyles.variants.variant
type ButtonSizes = keyof typeof buttonStyles.variants.size

const variants = Object.keys(buttonStyles.variants.variant) as ButtonVariants[]
const sizes = Object.keys(buttonStyles.variants.size) as ButtonSizes[]

const meta: Meta<typeof Button> = {
  title: 'Actions/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Displays a button using tailwind-variants: https://ui.shadcn.com/docs/components/button',
      },
    },
  },
  argTypes: {
    variant: {
      description: 'Defines the theme of the button',
      table: {
        type: { summary: variants.join(' | ') },
        defaultValue: { summary: 'primary' },
      },
      control: 'select',
      options: variants,
    },
    size: {
      description: 'Defines the size of the button',
      table: {
        type: { summary: sizes.join(' | ') },
        defaultValue: { summary: 'md' },
      },
      control: 'select',
      options: sizes,
    },
    children: {
      description: 'Button content',
      control: 'text',
      defaultValue: 'Button',
    },
    icon: { control: false },
    iconAnimated: { control: 'boolean' },
    iconPosition: { control: 'select', options: ['left', 'center'] },
    loading: { control: 'boolean' },
    full: { control: 'boolean' },
  },
  render: ({ children, ...args }) => <Button {...args}>{children}</Button>,
} satisfies Meta<typeof Button>

export default meta
meta.args = {
  children: 'Button Text',
}

type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { variant: 'primary' },
}

export const Secondary: Story = {
  args: { variant: 'secondary' },
}

export const Outline: Story = {
  args: { variant: 'outline' },
}

export const Transparent: Story = {
  args: { variant: 'transparent' },
}

export const Filled: Story = {
  args: { variant: 'filled' },
}

export const Tag: Story = {
  args: { variant: 'tag', children: 'Filter' },
}

export const TagActive: Story = {
  args: { variant: 'tag', children: 'Filter', className: 'is-active' },
}

export const Icon: Story = {
  args: { variant: 'icon', children: <X size={16} />, 'aria-label': 'Close' },
}

export const Sidebar: Story = {
  args: { variant: 'sidebar', children: 'Navigation item', className: 'justify-start' },
}

export const Link: Story = {
  args: { variant: 'link', children: 'Review recommendations', icon: <ArrowRight size={14} /> },
}

export const MenuItem: Story = {
  args: { variant: 'menuItem', children: 'Duplicate' },
  render: (args) => (
    <div className="flex w-48 flex-col space-y-2 rounded-md border p-3 shadow-md">
      <Button {...args}>
        <Copy size={16} strokeWidth={2} />
        <span>Duplicate</span>
      </Button>
      <Button {...args} className="text-destructive">
        <Trash2 size={16} strokeWidth={2} />
        <span>Delete</span>
      </Button>
      <Button {...args} disabled>
        <Copy size={16} strokeWidth={2} />
        <span>Disabled</span>
      </Button>
    </div>
  ),
}

export const Destructive: Story = {
  args: { variant: 'destructive' },
}

export const DestructiveOutline: Story = {
  args: { variant: 'destructiveOutline', children: 'Delete account' },
}

export const Success: Story = {
  args: { variant: 'success' },
}

export const Approve: Story = {
  args: { variant: 'approve', children: 'Approve', icon: <Check size={16} />, iconPosition: 'left' },
}

export const Small: Story = {
  args: { size: 'sm', variant: 'primary', icon: <ArrowRight /> },
}

export const Medium: Story = {
  args: { size: 'md', variant: 'primary', icon: <ArrowUpRight />, iconAnimated: true },
}

export const Large: Story = {
  args: { size: 'lg', variant: 'primary' },
}

export const IconLeft: Story = {
  args: { icon: <InfoIcon />, iconPosition: 'left' },
}

export const BrandIcon: Story = {
  args: { icon: <GoogleIcon />, iconPosition: 'left', variant: 'outline' },
}

export const Loading: Story = {
  args: { loading: true },
}
