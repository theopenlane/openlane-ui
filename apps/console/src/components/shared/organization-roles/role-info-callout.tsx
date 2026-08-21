import { BookOpen } from 'lucide-react'
import { Callout } from '@/components/shared/callout/callout'
import { DocsLink } from '@/components/shared/docs-help/docs-link'
import { PERMISSIONS_MODEL_DOCS_URL } from '@/constants/docs'

const PERMISSIONS_MODEL_TOPIC = { title: 'Permissions Model', query: 'organization roles and permissions model', prefer: 'authorization' }

export const RoleInfoCallout = () => (
  <Callout variant="info" compact>
    Not sure which role to assign?{' '}
    <DocsLink topic={PERMISSIONS_MODEL_TOPIC} href={PERMISSIONS_MODEL_DOCS_URL} className="font-medium">
      Read more about roles
      <BookOpen size={12} className="ml-1 inline align-middle" aria-hidden />
    </DocsLink>
  </Callout>
)
