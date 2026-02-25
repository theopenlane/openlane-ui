import type { Meta, StoryObj } from '@storybook/react-vite'
import StepIndicator from './step-indicator'

const meta: Meta<typeof StepIndicator> = {
  title: 'Navigation/StepIndicator',
  component: StepIndicator,
  parameters: {
    docs: {
      description: {
        component: 'A small circular indicator used in multi-step flows. Active state renders a filled dot; inactive renders a smaller unfilled dot.',
      },
    },
  },
  argTypes: {
    active: {
      control: 'boolean',
      description: 'Whether this step is currently active',
    },
  },
} satisfies Meta<typeof StepIndicator>

export default meta

type Story = StoryObj<typeof meta>

export const Active: Story = {
  args: { active: true },
}

export const Inactive: Story = {
  args: { active: false },
}

export const StepSequence: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <StepIndicator active={true} />
      <StepIndicator active={false} />
      <StepIndicator active={false} />
      <StepIndicator active={false} />
    </div>
  ),
}
