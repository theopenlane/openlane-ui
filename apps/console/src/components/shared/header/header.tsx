import Link from 'next/link'
import { headerStyles } from './header.styles'
import { UserMenu } from '@/components/shared/user-menu/user-menu'
import { OrganizationSelector } from '../organization-selector/organization-selector'
import { Notifications } from '../notifications/notifications'

export default function Header() {
  const { header, nav, mobileSidebar, userNav } = headerStyles()
  return (
    <div className={header()}>
      <nav className={nav()}>
        <OrganizationSelector />

        <div className={mobileSidebar()}>
          <>MobileSidebar</>
        </div>

        <div className={userNav()}>
          <Link href="#">Feedback</Link>
          <Link href="#">Changelog</Link>
          <Link href="#">Docs</Link>
          <Notifications />
          <UserMenu />
        </div>
      </nav>
    </div>
  )
}
