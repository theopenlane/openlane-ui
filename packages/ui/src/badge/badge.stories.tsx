import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './badge'

const meta: Meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    docs: {
      description: {
        component: 'A badge component used to highlight small bits of information: https://ui.shadcn.com/docs/components/badge',
      },
    },
    backgrounds: { default: 'white' },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Badge>Default</Badge>,
}

export const Secondary: Story = {
  render: () => <Badge variant="secondary">Secondary</Badge>,
}

export const Outline: Story = {
  render: () => <Badge variant="outline">Outline</Badge>,
}
