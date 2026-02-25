import type { Meta, StoryObj } from '@storybook/react-vite'
import { Loading } from './loading'

const meta: Meta<typeof Loading> = {
  title: 'Feedback/Loading',
  component: Loading,
  parameters: {
    docs: {
      description: {
        component: 'Full-width animated loading spinner. No configurable props — renders a single CSS-animated element.',
      },
    },
  },
} satisfies Meta<typeof Loading>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="h-16 w-full">
        <Story />
      </div>
    ),
  ],
}
