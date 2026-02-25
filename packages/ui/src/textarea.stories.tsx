import type { Meta, StoryObj } from '@storybook/react-vite'
import { Textarea, EditableTextarea } from './textarea'

const meta: Meta<typeof Textarea> = {
  title: 'Forms/Textarea',
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component: 'Multi-line text input. Also exports EditableTextarea, a click-to-edit variant that renders as plain text until focused.',
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    rows: { control: { type: 'number' } },
  },
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter a description...',
  },
}

export const WithValue: Story = {
  args: {
    value: 'This is some existing content in the textarea.',
    onChange: () => {},
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'This field is disabled',
    disabled: true,
  },
}

export const Tall: Story = {
  args: {
    placeholder: 'Tall textarea with extra rows',
    rows: 8,
  },
}

export const EditableEmpty: Story = {
  name: 'EditableTextarea (empty)',
  render: () => <EditableTextarea placeholder="Click to edit..." />,
}

export const EditableWithValue: Story = {
  name: 'EditableTextarea (with value)',
  render: () => <EditableTextarea value="Click this text to edit it." onChange={() => {}} />,
}
