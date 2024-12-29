import Link from 'next/link'
import { headerStyles } from './header.styles'
import { UserMenu } from '@/components/shared/user-menu/user-menu'
import { OrganizationSelector } from '@/components/shared/organization-selector/organization-selector'
import { BreadcrumbNavigation } from '@/components/shared/breadcrumb-nav/breadcrumb'
import { GlobalSearch } from '@/components/shared/search/search'
// import { Notifications } from '../notifications/notifications'

export default function Header() {
  const { header, nav, mobileSidebar, userNav } = headerStyles()
  return (
    <div className={header()}>
      <nav className={nav()}>
        <div className='flex justify-start items-center'>
          <OrganizationSelector />

          <div className={mobileSidebar()}>
            <>MobileSidebar</>
          </div>

          <div className='pl-10'>
            <BreadcrumbNavigation />
          </div>
        </div>

        <div className={userNav()}>
          <GlobalSearch />
          <Link href="mailto:support@theopenlane.io">Feedback</Link>
          <Link href="https://docs.theopenlane.io">Docs</Link>
          {/* <Notifications /> */}
          <UserMenu />
        </div>
      </nav >
    </div >
  )
}
