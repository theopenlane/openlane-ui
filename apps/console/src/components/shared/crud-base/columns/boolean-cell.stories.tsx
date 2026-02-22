import type { Meta, StoryObj } from '@storybook/react-vite'
import { BooleanCell } from './boolean-cell'

const meta: Meta<typeof BooleanCell> = {
  title: 'Data/BooleanCell',
  component: BooleanCell,
  parameters: {
    docs: {
      description: {
        component: 'Renders a human-readable label for boolean values in table cells.',
      },
    },
  },
  argTypes: {
    trueLabel: {
      control: 'text',
      description: 'Label shown when value is truthy',
    },
    falseLabel: {
      control: 'text',
      description: 'Label shown when value is falsy',
    },
  },
} satisfies Meta<typeof BooleanCell>

export default meta

type Story = StoryObj<typeof meta>

export const True: Story = {
  args: {
    value: true,
  },
}

export const False: Story = {
  args: {
    value: false,
  },
}

export const Null: Story = {
  args: {
    value: null,
  },
}

export const CustomLabels: Story = {
  args: {
    value: true,
    trueLabel: 'Enabled',
    falseLabel: 'Disabled',
  },
}
