import { Logo } from '@repo/ui/logo'
import Link from 'next/link'
import React, { ReactNode, Suspense } from 'react'

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="flex items-center justify-center h-screen relative">
      <div className="w-full relative z-3 px-4">
        <div className="mx-auto animate-pulse w-96">
          <Logo theme="dark" />
        </div>
        <Suspense>{children}</Suspense>
        <div className="flex flex-col text-center text-sm mt-20">
          <Link href="/login">Back to login</Link>
        </div>
      </div>
    </main>
  )
}

export default layout
