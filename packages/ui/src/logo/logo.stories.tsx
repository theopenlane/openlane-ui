import type { Meta, StoryObj } from '@storybook/react'
import { Logo, logoStyles } from './logo'

type LogoVariants = keyof typeof logoStyles.variants
const themes = Object.keys(logoStyles.variants.theme) as LogoVariants[]

const meta: Meta<typeof Logo> = {
  title: 'UI/Logo',
  component: Logo,
  parameters: {
    docs: {
      description: {
        component:
          'Reusable logo component with full and icon-only variants. Please always use this component rather than importing an SVG',
      },
    },
  },
  argTypes: {
    theme: {
      description: 'Defines the theme of the logo',
      table: {
        type: { summary: themes.join('|') },
        defaultValue: { summary: 'light' },
      },
      control: 'select',
      options: themes,
    },
  },
  render: ({ ...args }) => {
    return <Logo {...args} />
  },
} satisfies Meta<typeof Logo>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = {
  parameters: {
    backgrounds: { default: 'light' },
  },
  args: {
    theme: 'light',
  },
}

export const Dark: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  args: {
    theme: 'dark',
  },
}

export const Blackberry: Story = {
  args: {
    theme: 'blackberry',
  },
}

export const Sunglow: Story = {
  args: {
    theme: 'sunglow',
  },
}

export const White: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  args: {
    theme: 'white',
  },
}

export const Small: Story = {
  args: {
    width: 140,
  },
}

export const IconDark: Story = {
  name: 'Icon only - Dark',
  parameters: {
    backgrounds: { default: 'dark' },
  },
  args: {
    theme: 'white',
    width: 80,
    asIcon: true,
  },
}

export const IconLight: Story = {
  name: 'Icon only - Light',
  args: {
    width: 80,
    asIcon: true,
    theme: 'blackberry',
  },
}
