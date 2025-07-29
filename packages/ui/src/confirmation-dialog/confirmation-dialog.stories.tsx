import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ConfirmationDialog } from './confirmation-dialog'
import { Button } from '@repo/ui/button'

const meta: Meta<typeof ConfirmationDialog> = {
  title: 'Feedback/ConfirmationDialog',
  component: ConfirmationDialog,
  parameters: {
    docs: {
      description: {
        component: 'A confirmation dialog used to prompt the user before performing a destructive action.',
      },
    },
    backgrounds: { default: 'white' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false)

    const handleConfirm = () => {
      setOpen(false)
    }

    return (
      <div className="space-y-4">
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete Item
        </Button>
        <ConfirmationDialog open={open} onOpenChange={setOpen} onConfirm={handleConfirm} title="Are you sure?" description="This action will permanently delete the item. This cannot be undone." />
      </div>
    )
  },
}
