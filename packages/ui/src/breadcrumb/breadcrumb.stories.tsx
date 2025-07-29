import type { Meta, StoryObj } from '@storybook/react-vite'

import { Slash } from 'lucide-react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from './breadcrumb'
const meta: Meta = {
  title: 'UI/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    docs: {
      description: {
        component: 'A navigation component that indicates the current page’s location within a navigational hierarchy: https://ui.shadcn.com/docs/components/breadcrumb',
      },
    },
    backgrounds: { default: 'white' },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const BreadcrumbExample: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <Slash />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="/programs">Programs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <Slash />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="/components">Programs</BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
}
