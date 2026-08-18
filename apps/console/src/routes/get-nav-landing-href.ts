import { type NavItem } from '@/types'

export const getNavLandingHref = (item: NavItem, isLocked: (child: NavItem) => boolean = () => false): string =>
  item.children?.find((child) => !child.hidden && !isLocked(child))?.href ?? item.children?.find((child) => !child.hidden)?.href ?? item.href
