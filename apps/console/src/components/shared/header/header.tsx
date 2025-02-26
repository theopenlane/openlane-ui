'use client'
import Link from 'next/link'
import { headerStyles } from './header.styles'
import { UserMenu } from '@/components/shared/user-menu/user-menu'
import { OrganizationSelector } from '@/components/shared/organization-selector/organization-selector'
import { BreadcrumbNavigation } from '@/components/shared/breadcrumb-nav/breadcrumb'
import { GlobalSearch } from '@/components/shared/search/search'
import { sidebarStyles } from '../sidebar/sidebar.styles'
import { useSidebar } from '@/hooks/useSidebar'
import { useState } from 'react'
import { PanelLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function Header() {
  const { data: session } = useSession()

  const { isOpen, toggle } = useSidebar()
  const [status, setStatus] = useState(false)

  const path = usePathname()

  const { header, nav, mobileSidebar, userNav } = headerStyles()
  const { expandNav } = sidebarStyles({
    status,
    isOpen,
  })

  const handleToggle = () => {
    setStatus(true)
    toggle()
    setTimeout(() => setStatus(false), 500)
  }

  if (session?.user.isOnboarding) {
    return (
      <div className={header()}>
        <nav className={nav()}>
          <div className="flex justify-start items-center">
            <OrganizationSelector />
          </div>
          <div className={userNav()}>
            <Link href="mailto:support@theopenlane.io">Feedback</Link>
            <Link href="https://docs.theopenlane.io">Docs</Link>
            <UserMenu />
          </div>
        </nav>
      </div>
    )
  }

  return (
    <div className={header()}>
      <nav className={nav()}>
        <div className="flex justify-start items-center">
          <OrganizationSelector />

          <div className={expandNav({ isOpen: !isOpen })} onClick={handleToggle}>
            <PanelLeft height={16} width={16} />
          </div>

          <div className={mobileSidebar()}>
            <>MobileSidebar</>
          </div>

          <div className="pl-10">
            <BreadcrumbNavigation />
          </div>
        </div>

        <div className={userNav()}>
          <GlobalSearch />
          <Link href="mailto:support@theopenlane.io">Feedback</Link>
          <Link href="https://docs.theopenlane.io">Docs</Link>
          <UserMenu />
        </div>
      </nav>
    </div>
  )
}
