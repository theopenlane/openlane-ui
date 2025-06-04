'use client'
import Link from 'next/link'
import { headerStyles } from './header.styles'
import { UserMenu } from '@/components/shared/user-menu/user-menu'
import { OrganizationSelector } from '@/components/shared/organization-selector/organization-selector'
import { BreadcrumbNavigation } from '@/components/shared/breadcrumb-nav/breadcrumb'
import { sidebarStyles } from '../sidebar/sidebar.styles'
import { useSidebar } from '@/hooks/useSidebar'
import { useState } from 'react'
import { BookText, ChevronRight, PanelLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { GlobalSearch } from '../search/search'
import { Logo } from '@repo/ui/logo'
import { DOCS_URL } from '@/constants'
import NavTriangle from '@/assets/NavTriangle'

export default function Header() {
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
            <SupportLinks />
            <UserMenu />
          </div>
        </nav>
      </div>
    )
  }

  return (
    <>
      <div className={header()}>
        <nav className={nav()}>
          <div className={expandNav({ isOpen: !isOpen })}>
            <OrganizationSelector />
            <NavTriangle size={31} className="text-border -ml-5" />

            <PanelLeft height={16} width={16} onClick={handleToggle} className="cursor-pointer" />
            <div className="border-l h-4" />
            <div className="flex justify-start items-center">
              <div className={mobileSidebar()}>
                <>MobileSidebar</>
              </div>

              <div className="pl-2.5">
                <BreadcrumbNavigation />
              </div>
            </div>
          </div>

          <div className={userNav()}>
            <GlobalSearch />
            <SupportLinks />
            <UserMenu />
          </div>
        </nav>
      </div>
    </>
  )
}

function SupportLinks() {
  return (
    <Link href={DOCS_URL} target="_blank" rel="noopener noreferrer" className="flex gap-2 items-center">
      <BookText className="text-input-text" size={16} />
      <p>Docs</p>
    </Link>
  )
}
