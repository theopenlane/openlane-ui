import React from 'react'
import Tfa from '@/components/pages/auth/tfa/tfa'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tfa',
}

const TfaPage: React.FC = () => <Tfa />

export default TfaPage
