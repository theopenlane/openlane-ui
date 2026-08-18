import { type Metadata } from 'next'
import { GLOBAL_BANNER_HEIGHT_VAR } from '@/constants/layout'

export const metadata: Metadata = {
  title: {
    template: '%s | Openlane | Streamlining Compliance, Securing Success',
    default: '',
  },
}

export default function Layout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <div className="w-full min-h-screen bg-background" style={{ paddingTop: `var(${GLOBAL_BANNER_HEIGHT_VAR}, 0px)` }}>
      {children}
    </div>
  )
}
