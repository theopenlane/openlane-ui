import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { CircleArrowLeft } from 'lucide-react'
import React from 'react'
import Path from '@/assets/Path.tsx'
import MiniCat from '@/assets/MiniCat.tsx'
import Switch from '@/assets/Switch.tsx'
import Wire from '@/assets/Wire.tsx'
import { SUPPORT_URL } from '@/constants'

type ErrorPageProps = {
  title?: string
  description?: React.ReactNode
}

const ErrorPage = ({ title, description }: ErrorPageProps) => {
  const router = useRouter()

  return (
    <div className="flex m-[146px] relative">
      <div className="px-4 w-[607px]">
        <div className="flex items-end mb-6 space-x-4 relative">
          <MiniCat className="absolute top-3.5 text-(--asset-color-bg)" />
          <Wire className="absolute top-[-162px] left-[34px] text-(--asset-color-bg)" />
          <Switch className="absolute bottom-[-104px] left-[82px] text-(--asset-color-bg)" />
          <Path className="absolute top-[-81px] left-[164px] text-(--asset-color-bg)" />
        </div>

        <p className="text-3xl font-semibold mb-3 leading-9 mt-[45%]">{title ?? 'The page could not be found'}</p>
        <p className="text-sm mb-6">
          {description ?? (
            <>
              If you think this is a mewstake,{' '}
              <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="underline">
                contact support
              </a>
              .
            </>
          )}
        </p>
        <Button icon={<CircleArrowLeft />} iconPosition="left" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}

export default ErrorPage
