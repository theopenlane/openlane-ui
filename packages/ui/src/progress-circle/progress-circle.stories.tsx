import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProgressCircle } from './progress-circle'

const meta: Meta<typeof ProgressCircle> = {
  title: 'Data/ProgressCircle',
  component: ProgressCircle,
  parameters: {
    docs: {
      description: {
        component: 'SVG-based circular progress indicator with multiple color variants.',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Current progress value',
    },
    max: {
      control: { type: 'number' },
      description: 'Maximum value (default 100)',
    },
    variant: {
      control: 'select',
      options: ['default', 'neutral', 'blue', 'warning', 'error', 'success'],
      description: 'Color variant',
    },
    radius: {
      control: { type: 'number' },
      description: 'SVG radius in pixels',
    },
    strokeWidth: {
      control: { type: 'number' },
      description: 'Stroke width in pixels',
    },
    showAnimation: {
      control: 'boolean',
      description: 'Whether to animate progress changes',
    },
  },
} satisfies Meta<typeof ProgressCircle>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { value: 65, variant: 'default' },
}

export const WithLabel = {
  render: () => (
    <ProgressCircle value={72} variant="default">
      <span className="text-sm font-medium">72%</span>
    </ProgressCircle>
  ),
}

export const Neutral: Story = {
  args: { value: 40, variant: 'neutral' },
}

export const Blue: Story = {
  args: { value: 55, variant: 'blue' },
}

export const Warning: Story = {
  args: { value: 80, variant: 'warning' },
}

export const Error: Story = {
  args: { value: 90, variant: 'error' },
}

export const Success: Story = {
  args: { value: 100, variant: 'success' },
}

export const Empty: Story = {
  args: { value: 0, variant: 'neutral' },
}

export const Large: Story = {
  args: { value: 60, radius: 56, strokeWidth: 8, variant: 'default' },
}

export const Variants = {
  render: () => (
    <div className="flex gap-6 items-center flex-wrap">
      {(['default', 'neutral', 'blue', 'warning', 'error', 'success'] as const).map((variant) => (
        <div key={variant} className="flex flex-col items-center gap-2">
          <ProgressCircle value={65} variant={variant}>
            <span className="text-xs font-medium">65%</span>
          </ProgressCircle>
          <span className="text-xs text-muted-foreground">{variant}</span>
        </div>
      ))}
    </div>
  ),
}
