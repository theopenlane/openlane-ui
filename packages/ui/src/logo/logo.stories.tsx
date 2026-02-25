import type { Meta, StoryObj } from '@storybook/react-vite'
import { Logo, logoStyles } from './logo'

type LogoVariants = keyof typeof logoStyles.variants
const themes = Object.keys(logoStyles.variants.theme) as LogoVariants[]

const meta: Meta<typeof Logo> = {
  title: 'Display/Logo',
  component: Logo,
  parameters: {
    docs: {
      description: {
        component: 'Reusable logo component with full and icon-only variants. Please always use this component rather than importing an SVG',
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
  args: {
    theme: 'light',
  },
}

export const Dark: Story = {
  args: {
    theme: 'dark',
  },
}

export const White: Story = {
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
  args: {
    theme: 'dark',
    width: 80,
    asIcon: true,
  },
  globals: {
    backgrounds: {
      value: 'dark',
    },
  },
}

export const IconLight: Story = {
  name: 'Icon only - Light',
  args: {
    width: 80,
    asIcon: true,
    theme: 'light',
  },
}
