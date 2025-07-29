import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarPopover, CalendarPopoverProps } from './calendar-popover'

const meta: Meta<CalendarPopoverProps<any>> = {
  title: 'UI/CalendarPopover',
  component: CalendarPopover,
  parameters: {
    docs: {
      description: {
        component: 'A calendar popover with various customization options.',
      },
    },
    backgrounds: { default: 'white' },
  },
  render: (args) => <CalendarPopover {...args} />,
  decorators: [
    (Story) => (
      <div style={{ marginBottom: '280px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<CalendarPopoverProps<any>>

export const Default: Story = {
  args: {
    defaultToday: true,
    required: false,
  },
}

export const WithRequiredField: Story = {
  args: {
    defaultToday: true,
    required: true,
  },
}

export const WithDefaultFutureDate: Story = {
  args: {
    defaultAddDays: 365,
  },
}

export const EmptyField: Story = {
  args: {
    defaultToday: false,
  },
}
