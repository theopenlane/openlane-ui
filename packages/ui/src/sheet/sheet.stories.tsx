import type { Meta, StoryObj } from '@storybook/react-vite'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from './sheet'

const meta: Meta<typeof Sheet> = {
  title: 'UI/Sheet',
  component: Sheet,
  parameters: {
    docs: {
      description: {
        component: 'A versatile sheet component for displaying side panels or modal-like content. Built with Radix UI Dialog and supports configurable sides.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger className="btn">Open Sheet</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Default Sheet</SheetTitle>
          <SheetDescription>This is a default sheet. Customize its content and behavior as needed.</SheetDescription>
        </SheetHeader>
        <div className="content">Your content goes here.</div>
        <SheetFooter>
          <button className="btn">Action</button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const WithCustomSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger className="btn">Open from Bottom</SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Bottom Sheet</SheetTitle>
          <SheetDescription>This sheet slides in from the bottom of the screen.</SheetDescription>
        </SheetHeader>
        <div className="content">Custom side content here.</div>
        <SheetFooter>
          <button className="btn">Close</button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const WithDisabledClose: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger className="btn">Open Sheet</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet Without Close</SheetTitle>
          <SheetDescription>The close button is disabled in this example.</SheetDescription>
        </SheetHeader>
        <div className="content">Your content goes here.</div>
        <SheetFooter>
          <button className="btn">Action</button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}
