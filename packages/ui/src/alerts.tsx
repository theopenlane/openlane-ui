'use client'

import { signOut } from 'next-auth/react'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import bellIcon from './assets/bell.svg'

export const Alerts = () => {
  return (
    <Menu as="div" className="relative ">
      <Menu.Button className="flex items-center w-8 h-8">
        <span className="sr-only">Open alert menu</span>
        <span className="sr-only">View notifications</span>
        <Image alt="alerts icons" src={bellIcon} />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white dark:bg-teal900 py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
          <ul className="w-full px-2">
            <li className="w-full">
              <h3 className="w-full text-sm text-center">No new alerts 🎉</h3>
            </li>
          </ul>
        </div>
      </Transition>
    </Menu>
  )
}

export default Alerts
