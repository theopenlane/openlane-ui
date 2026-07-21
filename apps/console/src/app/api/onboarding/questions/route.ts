import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { mockOnboardingQuestionsResponse } from '@/lib/onboarding-questions/mock-data'

export const GET = async () => {
  const session = await auth()

  if (!session || !session.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(mockOnboardingQuestionsResponse)
}
