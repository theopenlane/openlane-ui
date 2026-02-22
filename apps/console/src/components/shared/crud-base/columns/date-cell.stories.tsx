import type { Meta, StoryObj } from '@storybook/react-vite'
import { DateCell } from './date-cell'

const meta: Meta<typeof DateCell> = {
  title: 'Data/DateCell',
  component: DateCell,
  parameters: {
    docs: {
      description: {
        component: 'Renders a formatted date string in a non-wrapping span for table cells.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['date', 'timesince'],
      description: 'Format variant: "date" for absolute date, "timesince" for relative time',
    },
  },
} satisfies Meta<typeof DateCell>

export default meta

type Story = StoryObj<typeof meta>

export const ValidDate: Story = {
  args: {
    value: '2025-06-15T10:00:00Z',
    variant: 'date',
  },
}

export const NullDate: Story = {
  args: {
    value: null,
    variant: 'date',
  },
}

export const TimeSinceVariant: Story = {
  args: {
    value: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    variant: 'timesince',
  },
}
