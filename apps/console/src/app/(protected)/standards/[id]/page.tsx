'use client'

import { useParams } from 'next/navigation'
import StandardDetailsView from '@/components/pages/protected/standards/standard-details-view'

const StandardDetailsPage = () => {
  const { id } = useParams()
  return <StandardDetailsView standardId={id as string} />
}

export default StandardDetailsPage
