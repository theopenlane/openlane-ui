import type { Meta, StoryObj } from '@storybook/react'

import { Slash } from "lucide-react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "./breadcrumb"
const meta: Meta = {
    title: 'UI/Breadcrumb',
    component: Breadcrumb,
    parameters: {
        docs: {
            description: {
                component:
                    'A navigation component that indicates the current page’s location within a navigational hierarchy: https://ui.shadcn.com/docs/components/breadcrumb',
            },
        },
        backgrounds: { default: 'white' },
    },
    render: ({ children, ...args }: { children: React.ReactNode }) => {
        return (
            <BreadcrumbExample />
        )
    },
} satisfies Meta

export default meta
meta.args = {
    src: 'Email',
    type: 'email',
}
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
                    <BreadcrumbLink href="/components">Components</BreadcrumbLink>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    ),
}