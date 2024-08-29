import type { Meta, StoryObj } from '@storybook/react'
import { Checkbox } from './checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  parameters: {
    docs: {
      description: {
        component:
          'A control that allows the user to toggle between checked and not checked.',
      },
    },
    backgrounds: { default: 'white' },
  },
  render: (args) => <Checkbox {...args} />,
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const SingleCheckbox: Story = {
  args: {
    'aria-label': 'Single Checkbox',
  },
}

export const MultipleCheckboxesWithLabels: Story = {
  render: () => (
    <div className="space-y-2 font-sans">
      <div className="flex items-center space-x-2">
        <Checkbox id="checkbox1" />
        <label htmlFor="checkbox1" className="text-sm">
          Checkbox 1
        </label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="checkbox2" />
        <label htmlFor="checkbox2" className="text-sm">
          Checkbox 2
        </label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="checkbox3" />
        <label htmlFor="checkbox3" className="text-sm">
          Checkbox 3
        </label>
      </div>
    </div>
  ),
}

export const DisabledCheckboxes: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox id="checkbox4" disabled />
        <label htmlFor="checkbox4" className="text-sm">
          Disabled Checkbox 1
        </label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="checkbox5" disabled />
        <label htmlFor="checkbox5" className="text-sm">
          Disabled Checkbox 2
        </label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="checkbox6" disabled />
        <label htmlFor="checkbox6" className="text-sm">
          Disabled Checkbox 3
        </label>
      </div>
    </div>
  ),
}
