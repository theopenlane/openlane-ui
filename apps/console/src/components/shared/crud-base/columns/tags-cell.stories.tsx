import type { Meta, StoryObj } from '@storybook/react-vite'
import { TagsCell } from './tags-cell'

const meta: Meta<typeof TagsCell> = {
  title: 'Data/TagsCell',
  component: TagsCell,
  parameters: {
    docs: {
      description: {
        component: 'Renders a list of tag chips for table cells. Renders "-" when tags are absent.',
      },
    },
  },
  argTypes: {
    wrap: {
      control: 'boolean',
      description: 'Whether tags should wrap to multiple lines',
    },
  },
} satisfies Meta<typeof TagsCell>

export default meta

type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    tags: [],
  },
}

export const SingleTag: Story = {
  args: {
    tags: ['compliance'],
  },
}

export const MultipleTags: Story = {
  args: {
    tags: ['compliance', 'security', 'audit'],
  },
}

export const ManyTagsWrapping: Story = {
  args: {
    tags: ['compliance', 'security', 'audit', 'gdpr', 'hipaa', 'sox', 'pci-dss', 'iso27001'],
    wrap: true,
  },
}
