import type { Meta, StoryObj } from '@storybook/react'
import { Tag } from './tag'

const meta: Meta<typeof Tag> = {
  title: 'UI/Tag',
  component: Tag,
  parameters: {
    docs: {
      description: {
        component:
          'This is a Tag component used for displaying categories or labels.',
      },
    },
  },
} satisfies Meta<typeof Tag>

export default meta

export const Default: StoryObj<typeof meta> = {
  args: {
    children: 'Category Name',
  },
}
