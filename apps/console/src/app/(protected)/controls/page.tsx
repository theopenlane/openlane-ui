import { Metadata } from 'next'
import { ControlSwitcher } from '@/components/shared/tab-switcher/control-switcher.tsx'

export const metadata: Metadata = {
  title: 'Control Report',
}

const Page: React.FC = () => {
  return <ControlSwitcher />
}

export default Page
