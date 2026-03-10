import type { Meta, StoryObj } from '@storybook/react-vite'
import { type User } from '@repo/codegen/src/schema'
import { UserCell } from './user-cell'

const mockUser: User = {
  id: 'user-1',
  displayName: 'Jane Smith',
  avatarRemoteURL: undefined,
} as unknown as User

const mockUserNoName: User = {
  id: 'user-2',
  displayName: '',
} as unknown as User

const meta: Meta<typeof UserCell> = {
  title: 'Data/UserCell',
  component: UserCell,
  parameters: {
    docs: {
      description: {
        component: 'Renders a user avatar and display name for table cells. Falls back to "Deleted user" when no user is provided.',
      },
    },
  },
} satisfies Meta<typeof UserCell>

export default meta

type Story = StoryObj<typeof meta>

export const WithUser: Story = {
  args: {
    user: mockUser,
  },
}

export const DeletedUser: Story = {
  args: {
    user: undefined,
  },
}

export const NoDisplayName: Story = {
  args: {
    user: mockUserNoName,
  },
}
