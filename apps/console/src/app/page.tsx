'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@repo/ui/logo'

const Landing = () => {
  const router = useRouter()

  useEffect(() => {
    router.push('/dashboard')
  }, [router])

  return (
    <main className="flex items-center justify-center h-screen relative">
      <div className="w-full relative z-3 px-4">
        <div className="mx-auto animate-pulse w-96">
          <Logo />
        </div>
        <h1 className="text-lg text-center mt-4">crafting security, one byte at a time...</h1>
      </div>
    </main>
  )
}

export default Landing
