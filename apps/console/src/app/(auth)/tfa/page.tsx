import React from 'react'
import Tfa from '@/components/pages/auth/tfa/tfa'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Two Factor Authentication',
}

const TfaPage: React.FC = () => <Tfa />

export default TfaPage
