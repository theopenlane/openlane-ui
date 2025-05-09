'use client'

import { ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { OPENLANE_WEBSITE_URL } from '../../../constants'
import { authStyles } from './auth.styles'
import { Button } from '@repo/ui/button'

export interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { base, closeButton } = authStyles()

  return (
    <div className={base()}>
      {children}
      <div className={closeButton()}>
        <Link href={OPENLANE_WEBSITE_URL}>
          <Button className="!py-2 !px-1.5 !h-8" variant="outline" icon={<ArrowLeft size={16} />} iconPosition="left">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
