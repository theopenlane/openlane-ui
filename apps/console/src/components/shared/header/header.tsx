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
import { CreditCard, PanelLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationBilling } from '@/lib/graphql-hooks/organization'

export default function Header() {
  const { data: session } = useSession()

  const { currentOrgId } = useOrganization()
  const { data, isLoading } = useGetOrganizationBilling(currentOrgId)

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

  if (path === '/onboarding') {
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
    <>
      {/* Banner 1 – Dark brown background */}
      <div className="bg-note text-sm text-input-text flex justify-center items-center px-4 py-1 w-full">
        <span>Your 30-day free trial ends soon, and there is no payment method on file</span>
        <Link href="/billing" className="ml-4 bg-[#e6b422] hover:bg-[#d4a319] text-black font-medium px-3 py-1 rounded transition-colors duration-200 flex items-center flex gap-2">
          <CreditCard size={9} />
          <span className="text-xs">Add payment method</span>
        </Link>
      </div>

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
    </>
  )
}
