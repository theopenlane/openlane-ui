import type { Meta, StoryObj } from '@storybook/react'
import { Paragraph } from './pargraph'

const meta: Meta<typeof Paragraph> = {
  title: 'UI/Paragraph',
  component: Paragraph,
  parameters: {
    docs: {
      description: {
        component: 'Paragraph component',
      },
    },
    backgrounds: { default: 'white' },
  },
  render: (args: any) => {
    return <Paragraph {...args} />
  },
} satisfies Meta<typeof Paragraph>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    paragraph: 'The quick brown fox jumps over the lazy dog',
  },
}
