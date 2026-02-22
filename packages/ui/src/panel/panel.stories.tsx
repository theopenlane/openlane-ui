import type { Meta, StoryObj } from '@storybook/react-vite'
import { Panel, PanelHeader } from './panel'

const meta: Meta<typeof Panel> = {
  title: 'Layout/Panel',
  component: Panel,
  parameters: {
    docs: {
      description: {
        component: 'Bordered card container with configurable gap, alignment, and destructive state. PanelHeader provides a standard heading + subheading layout.',
      },
    },
  },
  argTypes: {
    gap: {
      control: 'select',
      options: [0, 1, 2, 4, 6, 8],
      description: 'Gap between children',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch'],
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
    },
    destructive: {
      control: 'boolean',
      description: 'Renders with a warning icon and destructive styling',
    },
  },
} satisfies Meta<typeof Panel>

export default meta

type Story = StoryObj<typeof meta>

export const Default = {
  render: () => (
    <Panel>
      <PanelHeader heading="Panel heading" subheading="Optional subheading providing more context." />
      <p className="text-sm text-muted-foreground">Panel body content goes here.</p>
    </Panel>
  ),
}

export const HeaderNoBorder = {
  render: () => (
    <Panel>
      <PanelHeader heading="No border header" noBorder />
      <p className="text-sm text-muted-foreground">This header has no bottom border.</p>
    </Panel>
  ),
}

export const Destructive = {
  render: () => (
    <Panel destructive>
      <p className="text-sm font-medium">This action cannot be undone.</p>
      <p className="text-sm">Deleting this resource will permanently remove all associated data.</p>
    </Panel>
  ),
}

export const ContentOnly = {
  render: () => (
    <Panel gap={4}>
      <p className="text-sm">First item</p>
      <p className="text-sm">Second item</p>
      <p className="text-sm">Third item</p>
    </Panel>
  ),
}
