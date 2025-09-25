'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OPENLANE_WEBSITE_URL } from '@/constants'
import { authStyles } from './auth.styles'
import { Button } from '@repo/ui/button'
import Triangle from '@/assets/Triangle'

export interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { base, closeButton } = authStyles()
  const pathname = usePathname()

  const showTriangles = pathname === '/subscriber-verify'

  return (
    <div className={base()}>
      {showTriangles && (
        <>
          <Triangle className="hidden md:block md:h-[1000px] lg:h-[1263px] md:-top-40 lg:-top-80 left-[21%] w-auto absolute z-0" />
          <Triangle className="hidden md:block md:h-[1000px] lg:h-[1263px] top-0 left-1/2 w-auto absolute z-0" />
        </>
      )}

      {children}

      <div className={closeButton()}>
        <Link href={OPENLANE_WEBSITE_URL}>
          <Button className="!py-2 !px-1.5 !h-8 bg-transparent" variant="outline" icon={<ArrowLeft size={16} />} iconPosition="left">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
