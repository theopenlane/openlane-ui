import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component: 'Tabs component: https://ui.shadcn.com/docs/components/tabs',
      },
    },
  },

  render: ({ ...args }) => {
    return (
      <Tabs {...args} defaultValue="tabOne">
        <TabsList>
          <TabsTrigger value="tabOne">Tab one</TabsTrigger>
          <TabsTrigger value="tabTwo">Tab two</TabsTrigger>
        </TabsList>
        <TabsContent value="tabOne">
          <div className="p-4">Tab one</div>
        </TabsContent>
        <TabsContent value="tabTwo">
          <div className="p-4">Tab two</div>
        </TabsContent>
      </Tabs>
    )
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    backgrounds: { default: 'white' },
  },
}
