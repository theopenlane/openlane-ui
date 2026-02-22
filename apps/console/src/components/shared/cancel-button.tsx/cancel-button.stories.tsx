import type { Meta, StoryObj } from '@storybook/react-vite'
import { CancelButton } from './cancel-button'

const meta: Meta<typeof CancelButton> = {
  title: 'Actions/CancelButton',
  component: CancelButton,
  parameters: {
    docs: {
      description: {
        component: 'A button pre-configured with an X icon for cancellation actions. Wraps the shared Button component.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Button label (default: "Cancel")',
    },
    disabled: {
      control: 'boolean',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'secondaryOutline', 'destructive', 'outline', 'outlineLight'],
      description: 'Button variant (default: "secondary")',
    },
  },
} satisfies Meta<typeof CancelButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Cancel',
  },
}

export const CustomLabel: Story = {
  args: {
    title: 'Discard changes',
  },
}

export const Disabled: Story = {
  args: {
    title: 'Cancel',
    disabled: true,
  },
}

export const DestructiveVariant: Story = {
  args: {
    title: 'Cancel',
    variant: 'destructive',
  },
}
