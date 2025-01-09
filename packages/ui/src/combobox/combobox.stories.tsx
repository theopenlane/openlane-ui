import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import ComboBox from './combobox'

const meta: Meta<typeof ComboBox> = {
  title: 'UI/ComboBox',
  component: ComboBox,
  parameters: {
    docs: {
      description: {
        component: 'A combobox allows users to select an option from a dropdown list with search capabilities. https://ui.shadcn.com/docs/components/combobox',
      },
    },
  },
  render: () => {
    const [selectedValue, setSelectedValue] = useState('')

    const options = [
      { value: 'react', label: 'React' },
      { value: 'vue', label: 'Vue.js' },
      { value: 'angular', label: 'Angular' },
    ]

    return <ComboBox options={options} value={selectedValue} onChange={setSelectedValue} />
  },
} satisfies Meta<typeof ComboBox>

export default meta
type Story = StoryObj<typeof meta>

export const Example: Story = {}

export const PreselectedComboBox: Story = {
  render: () => {
    const [selectedValue, setSelectedValue] = useState('vue')

    const options = [
      { value: 'react', label: 'React' },
      { value: 'vue', label: 'Vue.js' },
      { value: 'angular', label: 'Angular' },
    ]

    return <ComboBox options={options} value={selectedValue} onChange={setSelectedValue} />
  },
}

export const EmptyComboBox: Story = {
  render: () => {
    const [selectedValue, setSelectedValue] = useState('')

    return <ComboBox options={[]} value={selectedValue} onChange={setSelectedValue} />
  },
}
