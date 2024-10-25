'use client'

import { Fragment, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog, Transition, Disclosure } from '@headlessui/react'
import { clsx } from 'clsx'
import chevronRight from './assets/chevron-right.svg'
import bars from './assets/horizonal-bars.svg'
import arrowRight from './assets/arrow-right.svg'

export const Drawer = ({ routes, currentPath }: any) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [tabletMenuOpen, setTabletMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        /**
         * Window is going into mobile mode
         */
        if (window.innerWidth < 1024) {
          setIsMobile(true)
          /**
           * If user has tablet menu open when playing with window
           * size or rotating device, retain the open menu state
           */
          if (tabletMenuOpen) {
            setMobileMenuOpen(true)
            setTabletMenuOpen(false)
          }
        }
        /**
         * Window is going into tablet mode
         */
        if (window.innerWidth >= 1024) {
          setIsMobile(false)
          /**
           * If user has mobile menu open when playing with window
           * size or rotating device, retain the open menu state
           */
          if (mobileMenuOpen) {
            setMobileMenuOpen(false)
            setTabletMenuOpen(true)
          }
        }
      }

      window.addEventListener('resize', handleResize)
      handleResize()

      return () => window.removeEventListener('resize', handleResize)
    }
  }, [mobileMenuOpen, tabletMenuOpen])

  routes.map((route: any) => {
    route.current = false

    if (route.children) {
      route.current = pathname.includes(route.href)

      route.children.map((childRoute: any) => {
        childRoute.current = false
        childRoute.current = pathname === childRoute.href
      })
    }

    if (route.detail) {
      route.current = pathname.includes(route.href)
    }

    if (!route.children || !route.detail) {
      route.current = route.href === pathname
    }
  })

  return (
    <>
      <Transition.Root show={mobileMenuOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative lg:hidden z-50 ease-in-out"
          onClose={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="2xl:hidden fixed inset-0 bg-java-200/70 dark:bg-java-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel>
                <div className="!w-72 !h-full !top-16 !inset-y-0 !z-30 !flex !flex-col bg-white dark:bg-java-800 border-0 border-r border-java-200 dark:border-java-700">
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto">
                    <nav className="flex flex-1 flex-col px-6 py-4 mb-8">
                      <ul className="flex flex-1 flex-col space-y-1 overflow-y-scroll overflow-x-clip">
                        {routes.map((item: any, idx: number) =>
                          item.name !== '_divider' ? (
                            <li key={idx}>
                              {!item.children ? (
                                <Link
                                  key={idx}
                                  className={clsx(
                                    item.current
                                      ? 'bg-java-50 dark:bg-java-700'
                                      : 'hover:bg-java-100 hover:dark:bg-java-900 hover:dark:text-oxford-blue-100',
                                    '!group !flex !items-center !gap-x-3 !rounded-md !p-2 !text-sm !leading-6 !transition-all !ease-in-out',
                                  )}
                                  href={item.href}
                                >
                                  <Image
                                    alt={`${item.name} icon`}
                                    aria-hidden="true"
                                    className="!h-4 !w-4 !shrink-0"
                                    src={item.icon}
                                  />
                                  {item.name}
                                </Link>
                              ) : (
                                <Disclosure as="div" key={`${idx}_parent`}>
                                  {({ open }) => (
                                    <>
                                      <Disclosure.Button
                                        className={clsx(
                                          item.current
                                            ? 'bg-java-50 dark:bg-java-700'
                                            : 'hover:bg-java-100 hover:dark:bg-java-900 hover:dark:text-oxford-blue-100',
                                          '!group !flex !w-full !items-center !gap-x-3 !rounded-md !p-2 !text-sm !leading-6 !transition-all !ease-in-out',
                                        )}
                                      >
                                        <Image
                                          alt={`${item.name} icon`}
                                          aria-hidden="true"
                                          className="h-auto w-auto"
                                          src={item.icon}
                                        />
                                        {item.name}
                                        <Image
                                          src={chevronRight}
                                          alt="open close chevron icon"
                                          className={clsx(
                                            open ? '!rotate-90' : null,
                                            '!ml-auto !w-3',
                                          )}
                                          aria-hidden="true"
                                        />
                                      </Disclosure.Button>
                                      <Disclosure.Panel
                                        as="ul"
                                        className="!mt-1 !pl-6"
                                      >
                                        {item?.children.map(
                                          (child: any, cdx: number) => (
                                            <li key={`${idx}_${cdx}_child`}>
                                              <Disclosure.Button
                                                as="a"
                                                href={child.href}
                                                className={clsx(
                                                  child.current
                                                    ? 'bg-java-50 dark:bg-java-700'
                                                    : 'hover:bg-java-100 hover:dark:bg-java-900 hover:dark:text-oxford-blue-100',
                                                  '!group !flex !items-center !gap-x-3 !rounded-md !p-2 !text-sm !leading-6 !transition-all !ease-in-out',
                                                )}
                                              >
                                                {child.name}
                                              </Disclosure.Button>
                                            </li>
                                          ),
                                        )}
                                      </Disclosure.Panel>
                                    </>
                                  )}
                                </Disclosure>
                              )}
                            </li>
                          ) : (
                            <li key={`${idx}_divider`}>
                              <div className="!h-0 !border-t !w-72 !border-java-200 dark:!border-java-700 -!ml-6 !my-6" />
                            </li>
                          ),
                        )}
                      </ul>
                    </nav>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div
        className={clsx(
          tabletMenuOpen ? '!w-72' : 'w-16 2xl:w-72',
          'hidden z-50 lg:flex fixed top-16 h-[calc(100%-4rem)] flex-col bg-white dark:bg-java-800 border-0 border-r border-java-200 dark:border-java-700 transition-all ease-in-out',
        )}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto">
          <nav
            className={clsx(
              tabletMenuOpen ? '!px-6' : null,
              'flex flex-1 flex-col px-2 2xl:px-6 py-4 mb-8',
            )}
          >
            <ul className="!flex !flex-1 !flex-col !space-y-1 !overflow-y-scroll !overflow-x-clip">
              {routes.map((item: any, idx: number) =>
                item.name !== '_divider' ? (
                  <li key={idx}>
                    {!item.children ? (
                      <Link
                        key={idx}
                        className={clsx(
                          item.current
                            ? 'bg-java-50 dark:bg-java-700'
                            : 'hover:bg-java-100 hover:dark:bg-java-900 hover:dark:text-oxford-blue-100',
                          tabletMenuOpen ? '!justify-start' : '',
                          'group flex justify-center 2xl:justify-start !items-center !gap-x-3 !rounded-md !p-2 !text-sm !leading-6!transition-all !ease-in-out',
                        )}
                        href={item.href}
                      >
                        <Image
                          alt={`${item.name} icon`}
                          aria-hidden="true"
                          className="h-4 w-4"
                          src={item.icon}
                        />
                        <span
                          className={clsx(
                            tabletMenuOpen ? '!flex' : null,
                            'hidden 2xl:inline-flex',
                          )}
                        >
                          {item.name}
                        </span>
                      </Link>
                    ) : (
                      <Disclosure as="div" key={`${idx}_parent`}>
                        {({ open }) => (
                          <>
                            <Disclosure.Button
                              className={clsx(
                                item.current
                                  ? 'bg-java-50 dark:bg-java-700'
                                  : 'hover:bg-java-100 hover:dark:bg-java-900 hover:dark:text-oxford-blue-100',
                                tabletMenuOpen ? '!flex' : null,
                                'group hidden 2xl:flex !justify-center !items-center !w-full !gap-x-3 !rounded-md !p-2 !text-sm !leading-6 !transition-all !ease-in-out',
                              )}
                            >
                              <Image
                                alt={`${item.name} icon`}
                                aria-hidden="true"
                                className="h-auto  w-auto"
                                src={item.icon}
                              />
                              <span
                                className={clsx(
                                  tabletMenuOpen ? '!flex' : null,
                                  'hidden 2xl:inline-flex',
                                )}
                              >
                                {item.name}
                              </span>
                              <Image
                                src={chevronRight}
                                alt="open close chevron icon"
                                className={clsx(
                                  open ? '!rotate-90' : null,
                                  tabletMenuOpen ? '!flex' : null,
                                  'ml-auto w-3 hidden 2xl:flex',
                                )}
                                aria-hidden="true"
                              />
                            </Disclosure.Button>
                            <Link
                              className={clsx(
                                item.current
                                  ? 'bg-java-50 dark:bg-java-700'
                                  : 'hover:!bg-java-100 hover:dark:!bg-java-900 hover:dark:!text-oxford-blue-100',
                                tabletMenuOpen ? '!hidden' : null,
                                'group flex 2xl:hidden justify-center !gap-x-3 !rounded-md !p-2 !text-sm !leading-6 !transition-all !ease-in-out',
                              )}
                              href={item?.children[0].href}
                            >
                              <Image
                                alt={`${item.name} icon`}
                                aria-hidden="true"
                                className="!h-4 !w-4 !shrink-0"
                                src={item.icon}
                              />
                            </Link>
                            <Disclosure.Panel
                              as="ul"
                              className={clsx(
                                tabletMenuOpen && open ? '!flex' : null,
                                tabletMenuOpen ? '!flex' : null,
                                '!flex-col !mt-1 !pl-7 hidden 2xl:flex',
                              )}
                            >
                              {item?.children.map((child: any, cdx: number) => (
                                <li key={`${idx}_${cdx}_child`}>
                                  <Disclosure.Button
                                    as="a"
                                    href={child.href}
                                    className={clsx(
                                      child.current
                                        ? 'bg-java-50 dark:bg-java-700'
                                        : 'hover:bg-java-100 hover:dark:bg-java-900 hover:dark:text-oxford-blue-100',
                                      'group flex items-center !gap-x-3 rounded-md p-2 text-sm leading-6 transition-all ease-in-out',
                                    )}
                                  >
                                    {child.name}
                                  </Disclosure.Button>
                                </li>
                              ))}
                            </Disclosure.Panel>
                          </>
                        )}
                      </Disclosure>
                    )}
                  </li>
                ) : (
                  <li key={`${idx}_divider`}>
                    <div className="!h-0 !border-t !w-72 !border-java-200 dark:!border-java-700 -!ml-6 !my-6" />
                  </li>
                ),
              )}
            </ul>
          </nav>
        </div>
      </div>

      <button
        className={clsx(
          tabletMenuOpen && !isMobile ? '!left-72' : null,
          `left-0 lg:left-16 2xl:hidden flex !items-center !px-4 !py-3 !min-w-14 !fixed !bottom-0 !rounded-tr bg-white dark:bg-java-400 !border-t !border-r border-java-800 dark:border-java-100 !z-50`,
        )}
        onClick={() => {
          if (window.innerWidth < 1023) {
            setMobileMenuOpen(!mobileMenuOpen)
          }

          if (window.innerWidth >= 1024) {
            setTabletMenuOpen(!tabletMenuOpen)
          }
        }}
        type="button"
      >
        <Image
          alt="menu icon icon"
          aria-hidden="true"
          className="!h-4 !w-4 !shrink-0"
          src={bars}
        />
        <Image
          alt="open close chevron icon"
          aria-hidden="true"
          className={clsx(
            tabletMenuOpen && !isMobile
              ? '!-rotate-180'
              : '!rotate-0 2xl:!rotate-180',
            '!ml-2 !w-4 !transition-all !ease-in-out',
          )}
          src={arrowRight}
        />
      </button>
    </>
  )
}

export default Drawer
