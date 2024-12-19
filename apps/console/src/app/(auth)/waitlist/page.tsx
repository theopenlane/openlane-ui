'use client'

import { Logo } from '@repo/ui/logo'
import { Panel } from '@repo/ui/panel'
import { Subscribe } from '@/components/pages/auth/subscribe/subscribe'
import Link from 'next/link'

const Waitlist: React.FC = () => {
  return (
    <main className="flex items-center justify-center h-screen relative">
      <div className="w-full relative z-3 px-4">
        <div className="mx-auto animate-pulse w-96">
          <Logo theme="dark" />
        </div>

        <Panel className='mt-10 bg-oxford-blue-950 border-none text-neutral-300'>
          <h2 className="text-2xl text-center">Thank you for your interest in Openlane!</h2>
          <div className="flex flex-col text-center">
            We are currently in a private beta, please subscribe to our newsletter to get notified when we launch.
          </div>
        </Panel>

        <Subscribe />

        <div className="flex flex-col text-center text-sm mt-20">
          <Link href="/login">Back to login</Link>
        </div>
      </div>
    </main>
  )
}

export default Waitlist
