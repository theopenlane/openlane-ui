import type { Meta, StoryObj } from '@storybook/react-vite'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './dialog'
import { Button } from '../button/button'

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    docs: {
      description: {
        component: 'A modal dialog that focuses the user’s attention and blocks interaction with the rest of the application. https://ui.shadcn.com/docs/components/dialog',
      },
    },
    backgrounds: { default: 'white' },
  },
  render: () => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="filled" size="md">
            Open Dialog
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>This action cannot be undone. Your organization and associated records will be deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button variant="filled">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Example: Story = {}

export const ConfirmationDialog: Story = {
  render: () => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="filled" size="md">
            Confirm Action
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Action</DialogTitle>
            <DialogDescription>Please confirm that you want to proceed with this action. This action is irreversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button variant="filled">Proceed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
}
