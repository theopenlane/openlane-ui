import type { Meta, StoryObj } from '@storybook/react-vite'
import { Label } from './label'
import { Input } from '../input/input'

const meta: Meta<typeof Label> = {
  title: 'Forms/Label',
  component: Label,
  parameters: {
    docs: {
      description: {
        component: 'Accessible form label built on @radix-ui/react-label.',
      },
    },
  },
  argTypes: {
    children: { control: 'text' },
  },
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Email address',
  },
}

export const WithInput = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
}

export const RequiredField = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="name">
        Full name <span className="text-destructive">*</span>
      </Label>
      <Input id="name" placeholder="Jane Smith" />
    </div>
  ),
}
