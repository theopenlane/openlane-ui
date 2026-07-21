import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { mockOnboardingQuestionsResponse } from '@/lib/onboarding-questions/mock-data'

// Stands in for the backend's `v1/onboarding/questions` endpoint
export async function GET() {
  const session = await auth()

  if (!session || !session.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(mockOnboardingQuestionsResponse)
}
