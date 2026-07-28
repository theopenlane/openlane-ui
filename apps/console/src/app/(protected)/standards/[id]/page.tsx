'use client'

import { useParams } from 'next/navigation'
import StandardDetailsView from '@/components/pages/protected/standards/standard-details-view'

const StandardDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  return <StandardDetailsView standardId={id} />
}

export default StandardDetailsPage
