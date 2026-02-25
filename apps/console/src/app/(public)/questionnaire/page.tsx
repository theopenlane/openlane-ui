import React, { Suspense } from 'react'
import AuthMarketingPanel from '@/components/shared/auth-marketing-panel/auth-marketing-panel'
import { Metadata } from 'next'
import { Logo } from '@repo/ui/logo'
import { QuestionnairePage } from '@/components/pages/public/questionnaire/questionnaire'

export const metadata: Metadata = {
  title: 'Questionnaire',
}

interface QuestionnaireProps {
  searchParams: Promise<{
    token?: string
  }>
}

const Questionnaire: React.FC<QuestionnaireProps> = async ({ searchParams }) => {
  const { token } = await searchParams

  return (
    <Suspense>
      <div className="flex h-full w-full min-h-screen">
        <div className="flex flex-col justify-between items-center w-full lg:w-4/5 relative">
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-[9999]">
            <Logo width={200} height={30} />
          </div>

          <div className="flex justify-center items-center w-full h-full lg:mt-3 lg:mb-3 lg:ml-6 z-[999] rounded-lg bg-secondary">
            <QuestionnairePage token={token} />
          </div>
        </div>

        <AuthMarketingPanel hideCopy={true} />
      </div>
    </Suspense>
  )
}

export default Questionnaire
