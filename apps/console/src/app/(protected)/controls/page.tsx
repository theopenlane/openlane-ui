import { ControlSwitcher } from '@/components/shared/control-switcher/control-switcher'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Control Report',
}

const Page: React.FC = () => {
  return <ControlSwitcher />
}

export default Page
