import { type NavItem } from '@/types'

export const getNavLandingHref = (item: NavItem): string => item.children?.find((child) => !child.hidden)?.href ?? item.href
