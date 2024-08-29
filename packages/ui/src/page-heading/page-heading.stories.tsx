import type { Meta, StoryObj } from '@storybook/react'
import { PageHeading } from './page-heading'

const meta: Meta<typeof PageHeading> = {
  title: 'UI/Page Heading',
  component: PageHeading,
  parameters: {
    docs: {
      description: {
        component: 'Page heading component',
      },
    },
    backgrounds: { default: 'white' },
  },
  render: (args) => {
    return <PageHeading {...args} />
  },
} satisfies Meta<typeof PageHeading>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    eyebrow: 'Workspace settings',
    heading: 'General',
  },
}
