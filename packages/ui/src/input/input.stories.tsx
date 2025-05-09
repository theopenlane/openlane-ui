import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'
import { SearchIcon } from 'lucide-react'

const meta: Meta<typeof Input> = {
  title: 'Forms/Input',
  component: Input,
  parameters: {
    docs: {
      description: {
        component: 'Form input component: https://ui.shadcn.com/docs/components/input',
      },
    },
    backgrounds: { default: 'white' },
  },
  render: ({ children, ...args }) => {
    return <Input {...args}>{children}</Input>
  },
} satisfies Meta<typeof Input>

export default meta
meta.args = {
  placeholder: 'Email',
  type: 'email',
}
type Story = StoryObj<typeof meta>

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Email',
  },
}

export const WithIcon: Story = {
  args: {
    placeholder: 'Search for an organization',
    icon: <SearchIcon width={17} />,
  },
}

export const WithPrefix: Story = {
  args: {
    prefix: 'https://',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}
