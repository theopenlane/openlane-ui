import React, { Suspense } from 'react'
import { type Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@repo/ui/logo'
import { QuestionnairePage } from '@/components/pages/public/questionnaire/questionnaire'
import { OPENLANE_WEBSITE_URL } from '@/constants'

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
      <div className="flex flex-col items-center min-h-screen w-full px-4 py-12">
        <div className="mb-8">
          <Logo width={200} height={30} />
        </div>

        <div className="flex-1 flex justify-center items-start w-full max-w-4xl">
          <QuestionnairePage token={token} />
        </div>

        <div className="mt-8 pb-4">
          <Link href={OPENLANE_WEBSITE_URL} className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span>Powered by</span>
            <span className="opacity-60 group-hover:opacity-100 transition-opacity">
              <Logo width={100} height={15} />
            </span>
          </Link>
        </div>
      </div>
    </Suspense>
  )
}

export default Questionnaire
