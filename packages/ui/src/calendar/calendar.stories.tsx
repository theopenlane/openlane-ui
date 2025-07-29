import { Calendar, CalendarProps } from './calendar'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta<CalendarProps> = {
  title: 'UI/Calendar',
  component: Calendar,
  parameters: {
    docs: {
      description: {
        component: 'Calendar component with various customization options',
      },
    },
    backgrounds: { default: 'white' },
  },
  render: (args: any) => {
    return <Calendar {...args} />
  },
}

export default meta

type Story = StoryObj<CalendarProps>

export const Default: Story = {
  args: {
    showOutsideDays: true,
  },
}

export const CustomClassNames: Story = {
  args: {
    showOutsideDays: true,
    classNames: {
      nav_button: 'custom-nav-button',
      day_selected: 'custom-day-selected',
    },
  },
}

export const WithoutOutsideDays: Story = {
  args: {
    showOutsideDays: false,
  },
}
