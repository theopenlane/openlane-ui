import type { Meta, StoryObj } from '@storybook/react-vite'
import { Callout } from './callout'

const meta: Meta<typeof Callout> = {
  title: 'Feedback/Callout',
  component: Callout,
  parameters: {
    docs: {
      description: {
        component: 'Contextual callout block with 5 semantic variants: info, success, warning, danger, and suggestion.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger', 'suggestion'],
      description: 'Semantic variant controlling color and icon',
    },
    compact: {
      control: 'boolean',
      description: 'Reduces vertical padding',
    },
    title: {
      control: 'text',
      description: 'Optional bold title above the body',
    },
  },
} satisfies Meta<typeof Callout>

export default meta

type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    children: 'This action will affect all members of the organization.',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Changes saved',
    children: 'Your settings have been updated successfully.',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Review required',
    children: 'This policy has not been reviewed in over 90 days.',
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    title: 'Action required',
    children: 'Two controls are failing and require immediate attention.',
  },
}

export const Suggestion: Story = {
  args: {
    variant: 'suggestion',
    title: 'Tip',
    children: 'You can assign multiple owners to a risk to distribute accountability.',
  },
}

export const Compact: Story = {
  args: {
    variant: 'info',
    compact: true,
    children: 'Compact callout with reduced vertical padding.',
  },
}

export const NoTitle: Story = {
  args: {
    variant: 'warning',
    children: 'Your trial expires in 3 days.',
  },
}
