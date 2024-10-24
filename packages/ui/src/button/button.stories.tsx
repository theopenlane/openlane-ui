import type { Meta, StoryObj } from '@storybook/react'
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
        component:
          'Displays a button or a component that looks like a button: https://ui.shadcn.com/docs/components/button',
      },
    },
  },
  argTypes: {
    variant: {
      description: 'Defines the theme of the button',
      table: {
        type: { summary: variants.join('|') },
        defaultValue: { summary: 'light' },
      },
      control: 'select',
      options: variants,
    },
    size: {
      description: 'Defines the sizing of the button',
      table: {
        type: { summary: sizes.join('|') },
        defaultValue: { summary: 'lg' },
      },
      control: 'select',
      options: sizes,
    },
    children: {
      description: 'Button text',
      control: 'text',
      defaultValue: 'Button',
    },
  },
  render: ({ children, ...args }) => {
    return <Button {...args}>{children}</Button>
  },
} satisfies Meta<typeof Button>

export default meta
meta.args = {
  children: 'Button Text',
}
type Story = StoryObj<typeof meta>

export const aquamarine: Story = {
  args: {
    variant: 'aquamarine',
  },
}


export const Outline: Story = {
  args: {
    variant: 'outline',
  },
}

export const Medium: Story = {
  args: {
    variant: 'aquamarine',
    size: 'md',
    icon: <ArrowUpRight />,
    iconAnimated: true,
  },
}

export const Smallaquamarine: Story = {
  args: {
    variant: 'aquamarine',
    size: 'sm',
    icon: <ArrowRight />,
  },
}

export const SmallWhite: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  args: {
    variant: 'white',
    size: 'sm',
    icon: <ArrowRight />,
  },
}

export const WithIconAndHoverAnimation: Story = {
  name: 'With icon and hover animation',
  args: {
    icon: <ArrowUpRight />,
    iconAnimated: true,
  },
}

export const IconPositionLeft: Story = {
  name: 'With static icon positioned on the left',
  args: {
    icon: <InfoIcon />,
    iconPosition: 'left',
  },
}

export const BrandIcon: Story = {
  args: {
    icon: <GoogleIcon />,
    iconPosition: 'left',
    variant: 'outline',
  },
}

export const Loading: Story = {
  name: 'In a loading state',
  args: {
    loading: true,
  },
}

export const Success: Story = {
  name: 'In a success state',
  args: {
    variant: 'success',
  },
}
