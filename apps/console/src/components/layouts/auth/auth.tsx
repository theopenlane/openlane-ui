'use client'

import Triangle from '@/assets/Triangle'
import OfficialOnly from '@/components/shared/official-only/official-only'
import { OPENLANE_WEBSITE_URL } from '@/constants'
import { GLOBAL_BANNER_HEIGHT_VAR } from '@/constants/layout'
import { Button } from '@repo/ui/button'
import { ArrowLeft } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { authStyles } from './auth.styles'

export interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { base, closeButton } = authStyles()
  const pathname = usePathname()

  const router = useRouter()

  const showTriangles = pathname === '/subscriber-verify'

  const isTFAPage = pathname === '/tfa'

  const handleClick = () => {
    let redirectURL = OPENLANE_WEBSITE_URL

    if (isTFAPage) {
      // since the cookie is http only, we cannot delete it from the client
      redirectURL = '/login?cleartfa=1'
    }

    router.push(redirectURL)
  }

  return (
    <div className={base()} style={{ paddingTop: `var(${GLOBAL_BANNER_HEIGHT_VAR}, 0px)` }}>
      {showTriangles && (
        <>
          <Triangle className="hidden md:block md:h-[1000px] lg:h-[1263px] md:-top-40 lg:-top-80 left-[21%] w-auto absolute z-0" />
          <Triangle className="hidden md:block md:h-[1000px] lg:h-[1263px] top-0 left-1/2 w-auto absolute z-0" />
        </>
      )}

      {children}

      <OfficialOnly>
        <div className={closeButton()} style={{ transform: `translateY(var(${GLOBAL_BANNER_HEIGHT_VAR}, 0px))` }}>
          <Button className="!py-2 !px-1.5 !h-8 bg-transparent" variant="outline" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={handleClick}>
            Back to {isTFAPage ? 'Login' : 'Home'}
          </Button>
        </div>
      </OfficialOnly>
    </div>
  )
}
