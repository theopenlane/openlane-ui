import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRight, ArrowUpRight, InfoIcon } from 'lucide-react'
import { GoogleIcon } from '../icons/google'
import { Button, buttonStyles } from './button'

type ButtonVariants = keyof typeof buttonStyles.variants.variant
type ButtonSizes = keyof typeof buttonStyles.variants.size

const variants = Object.keys(buttonStyles.variants.variant) as ButtonVariants[]
const sizes = Object.keys(buttonStyles.variants.size) as ButtonSizes[]

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
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
  render: ({ children, ...args }: { children: React.ReactNode }) => <Button {...args}>{children}</Button>,
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

export const SecondaryOutline: Story = {
  args: { variant: 'secondaryOutline' },
}

export const IconButton: Story = {
  args: { variant: 'iconButton', icon: <ArrowRight /> },
}

export const Filled: Story = {
  args: { variant: 'filled' },
}

export const Light: Story = {
  args: { variant: 'light' },
}

export const Outline: Story = {
  args: { variant: 'outline' },
}

export const OutlineLight: Story = {
  args: { variant: 'outlineLight' },
}

export const Success: Story = {
  args: { variant: 'success' },
}

export const Destructive: Story = {
  args: { variant: 'destructive' },
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
  args: { icon: <GoogleIcon />, iconPosition: 'left', variant: 'secondaryOutline' },
}

export const Loading: Story = {
  args: { loading: true },
}
