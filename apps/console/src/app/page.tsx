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
          <Logo theme='dark' />
        </div>

        <h1 className="text-2xl text-center mt-4">loading your platform...</h1>
      </div>
    </main>
  )
}

export default Landing
