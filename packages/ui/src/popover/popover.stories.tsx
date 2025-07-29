import type { Meta, StoryObj } from '@storybook/react-vite'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Button } from '../button/button'

const meta: Meta<typeof Popover> = {
  title: 'UI/Popover',
  component: Popover,
  parameters: {
    docs: {
      description: {
        component: 'Displays rich content in a portal, triggered by a button. https://ui.shadcn.com/docs/components/popover',
      },
    },
    backgrounds: { default: 'white' },
  },
  render: () => {
    return (
      <Popover>
        <PopoverTrigger>
          <Button variant="filled" size="md">
            Open popover menu
          </Button>
        </PopoverTrigger>
        <PopoverContent>Place content for the popover here.</PopoverContent>
      </Popover>
    )
  },
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Example: Story = {}
