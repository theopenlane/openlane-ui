import React from 'react'
import { Metadata } from 'next'
import ControlObjectivePage from '@/components/pages/protected/controls/tabs/implementation/control-objectives-components/control-objective-page'

export const metadata: Metadata = {
  title: 'Control Objectives',
}

const Page = () => <ControlObjectivePage />

export default Page
