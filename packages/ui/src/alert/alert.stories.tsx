import type { Meta, StoryObj } from '@storybook/react-vite'
import { Terminal, AlertCircle } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from './alert'

const meta: Meta<typeof Alert> = {
  title: 'Feedback/Alert',
  component: Alert,
  parameters: {
    docs: {
      description: {
        component: 'Displays a callout for user attention. Supports default and destructive variants.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
      description: 'Visual style of the alert',
    },
  },
} satisfies Meta<typeof Alert>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Alert>
      <Terminal className="h-4 w-4" />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>You can add components and dependencies to your app using the CLI.</AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
    </Alert>
  ),
}

export const TitleOnly: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Something happened</AlertTitle>
    </Alert>
  ),
}

export const DescriptionOnly: Story = {
  render: () => (
    <Alert>
      <AlertDescription>Changes have been saved automatically.</AlertDescription>
    </Alert>
  ),
}
