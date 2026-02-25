import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageBox } from './message-box'

const meta: Meta<typeof MessageBox> = {
  title: 'Feedback/MessageBox',
  component: MessageBox,
  parameters: {
    docs: {
      description: {
        component: 'Inline error message box. Renders a red-tinted alert with a message string.',
      },
    },
  },
  argTypes: {
    message: { control: 'text', description: 'The error message to display' },
    maxWidth: { control: 'text', description: 'Optional max-width CSS value (e.g. "400px")' },
  },
} satisfies Meta<typeof MessageBox>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    message: 'An unexpected error occurred. Please try again.',
  },
}

export const LongMessage: Story = {
  args: {
    message: 'Your request could not be completed because the provided email address is already associated with an existing account. Please use a different email or log in to your existing account.',
  },
}

export const Constrained: Story = {
  args: {
    message: 'Invalid credentials.',
    maxWidth: '320px',
  },
}
