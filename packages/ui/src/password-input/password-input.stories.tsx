import type { Meta, StoryObj } from '@storybook/react-vite'
import { PasswordInput } from './password-input'

const meta: Meta<typeof PasswordInput> = {
  title: 'Forms/PasswordInput',
  component: PasswordInput,
  parameters: {
    docs: {
      description: {
        component: 'Password input with a toggle button to reveal or hide the value. Suppresses browser-native password toggles.',
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof PasswordInput>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter your password',
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: 'supersecretpassword',
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled field',
    disabled: true,
  },
}
