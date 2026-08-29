import { type NavItem } from '@/types'
import { getNavLandingHref } from './get-nav-landing-href'

/**
 * ISS-2591 — clicking a nav section lands on its first usable child. Prefer one that is neither
 * hidden nor plan-locked, then fall back to a locked-but-visible child so the user reaches the
 * upgrade prompt instead of a dead link.
 */

const item = (href: string, children?: NavItem[]): NavItem => ({ title: href, href, children }) as NavItem
const child = (href: string, hidden = false): NavItem => ({ title: href, href, hidden }) as NavItem

describe('getNavLandingHref', () => {
  test('returns the section href when it has no children', () => {
    expect(getNavLandingHref(item('/registry'))).toBe('/registry')
  })

  test('returns the first visible child', () => {
    expect(getNavLandingHref(item('/registry', [child('/registry/platforms'), child('/registry/assets')]))).toBe('/registry/platforms')
  })

  test('skips hidden children', () => {
    expect(getNavLandingHref(item('/registry', [child('/registry/platforms', true), child('/registry/assets')]))).toBe('/registry/assets')
  })

  test('prefers an unlocked child over a locked one', () => {
    const isLocked = (candidate: NavItem) => candidate.href === '/registry/platforms'

    expect(getNavLandingHref(item('/registry', [child('/registry/platforms'), child('/registry/assets')]), isLocked)).toBe('/registry/assets')
  })

  test('falls back to a locked but visible child rather than the bare section', () => {
    // Better to land on the upgrade prompt than a section URL with no page.
    const isLocked = () => true

    expect(getNavLandingHref(item('/registry', [child('/registry/platforms')]), isLocked)).toBe('/registry/platforms')
  })

  test('falls back to the section href when every child is hidden', () => {
    const isLocked = () => true

    expect(getNavLandingHref(item('/registry', [child('/registry/platforms', true)]), isLocked)).toBe('/registry')
  })

  test('treats an empty children list as no children', () => {
    expect(getNavLandingHref(item('/registry', []))).toBe('/registry')
  })
})
