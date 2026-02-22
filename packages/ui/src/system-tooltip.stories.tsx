import type { Meta, StoryObj } from '@storybook/react-vite'
import { InfoIcon, HelpCircle, AlertCircle } from 'lucide-react'
import { SystemTooltip } from './system-tooltip'

const meta: Meta<typeof SystemTooltip> = {
  title: 'Overlays/Tooltip',
  component: SystemTooltip,
  parameters: {
    docs: {
      description: {
        component: 'Icon-triggered tooltip wrapper. Accepts an icon node and content (string or ReactNode). Defaults to bottom placement.',
      },
    },
  },
  argTypes: {
    side: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Tooltip placement relative to the trigger',
    },
    disableHoverableContent: {
      control: 'boolean',
      description: 'When true, tooltip closes when moving cursor toward content',
    },
  },
} satisfies Meta<typeof SystemTooltip>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    icon: <InfoIcon className="h-4 w-4 text-muted-foreground" />,
    content: 'This field is required for compliance tracking.',
  },
}

export const TopPlacement: Story = {
  args: {
    icon: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
    content: 'Tooltip appears above the icon.',
    side: 'top',
  },
}

export const RightPlacement: Story = {
  args: {
    icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
    content: 'Tooltip appears to the right.',
    side: 'right',
  },
}

export const RichContent: Story = {
  args: {
    icon: <InfoIcon className="h-4 w-4 text-muted-foreground" />,
    content: (
      <div className="flex flex-col gap-1">
        <span className="font-medium">Access roles</span>
        <span className="text-xs text-muted-foreground">Controls what actions a member can perform within the organization.</span>
      </div>
    ),
  },
}
