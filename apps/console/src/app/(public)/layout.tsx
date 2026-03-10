import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Openlane | Streamlining Compliance, Securing Success',
    default: '',
  },
}

export default function Layout({ children }: { children: React.ReactNode }): React.ReactNode {
  return <div className="w-full min-h-screen bg-background">{children}</div>
}
