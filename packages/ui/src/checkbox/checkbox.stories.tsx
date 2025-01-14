import type { Meta, StoryObj } from '@storybook/react'
import { Checkbox } from './checkbox'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { FormItem } from '@repo/ui/form'
import { useState } from 'react'

const meta: Meta<typeof Checkbox> = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  parameters: {
    docs: {
      description: {
        component: 'A control that allows the user to toggle between checked and not checked.',
      },
    },
    backgrounds: { default: 'white' },
  },
  render: (args: any) => <Checkbox {...args} />,
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

export const DropdownMultiselectCheckbox: Story = {
  render: () => {
    const [selectedToppings, setSelectedToppings] = useState<string[]>([])

    const handleSelect = (topping: string) => {
      setSelectedToppings((prev) => (prev.includes(topping) ? prev.filter((item) => item !== topping) : [...prev, topping]))
    }

    return (
      <FormItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            onSelect={(e) => {
              e.preventDefault()
            }}
            asChild
          >
            <Button variant="outlineInput">{selectedToppings.length > 0 ? `${selectedToppings.length} toppings selected` : 'Select Toppings'}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              key="Pepperoni"
              onSelect={(e) => {
                e.preventDefault()
              }}
              checked={selectedToppings.includes('Pepperoni')}
              onClick={() => handleSelect('Pepperoni')}
            >
              Pepperoni
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              key="Sausage"
              onSelect={(e) => {
                e.preventDefault()
              }}
              checked={selectedToppings.includes('Sausage')}
              onClick={() => handleSelect('Sausage')}
            >
              Sausage
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              key="Mushrooms"
              onSelect={(e) => {
                e.preventDefault()
              }}
              checked={selectedToppings.includes('Mushrooms')}
              onClick={() => handleSelect('Mushrooms')}
            >
              Mushrooms
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </FormItem>
    )
  },
}
