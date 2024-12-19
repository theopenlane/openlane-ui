import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardContent, CardDescription, CardTitle } from './card'

const meta: Meta = {
    title: 'UI/Card',
    component: Card,
    parameters: {
        docs: {
            description: {
                component:
                    'A navigation component that indicates the current page’s location within a navigational hierarchy: https://ui.shadcn.com/docs/components/breadcrumb',
            },
        },
    },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CardExampleComponent: Story = {
    render: ({ children, ...args }: { children?: React.ReactNode }) => {
        return (
            <Card {...args}>
                <CardTitle>
                    Openlane Compliance Module
                </CardTitle>
                <CardDescription>
                    Stay Secure with Ease
                </CardDescription>
                <CardContent>
                    Discover how Openlane empowers businesses to tackle modern cybersecurity threats with cutting-edge tools and technologies
                </CardContent>
            </Card>
        )
    },
};