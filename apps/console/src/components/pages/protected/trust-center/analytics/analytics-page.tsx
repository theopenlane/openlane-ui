'use client'

const accessLink = process.env.NEXT_PUBLIC_ANALYTICS_ACCESS_LINK || ''

export default function AnalyticsPage() {
  return <iframe src={`${accessLink}&ui=hide&mode=dark`} width="100%" height="100%" style={{ border: 'none' }}></iframe>
}
