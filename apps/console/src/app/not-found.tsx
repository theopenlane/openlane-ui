'use client'

import { DashboardLayout } from '@/components/layouts/dashboard/dashboard.tsx'
import ErrorPage from '@/components/shared/error/error-page.tsx'

export default function NotFound() {
  return <DashboardLayout error={<ErrorPage />} />
}
