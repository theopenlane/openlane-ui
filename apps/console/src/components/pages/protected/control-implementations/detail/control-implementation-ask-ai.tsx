import React from 'react'
import { useSession } from 'next-auth/react'
import AIChat from '@/components/shared/ai-suggetions/chat'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { type ControlImplementationDetailNode } from '@/lib/graphql-hooks/control-implementation'

type TControlImplementationAskAIProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  implementation: ControlImplementationDetailNode
  title: string
  organizationName?: string
}

const ControlImplementationAskAI: React.FC<TControlImplementationAskAIProps> = ({ open, onOpenChange, implementation, title, organizationName }) => {
  const { data: session } = useSession()
  const { data: userData } = useGetCurrentUser(session?.user?.userId)
  const linkedControls = [...getNodes(implementation.controls), ...getNodes(implementation.subcontrols)].map(({ refCode, referenceFramework }) => ({ refCode, framework: referenceFramework }))

  return (
    <AIChat
      open={open}
      onOpenChange={onOpenChange}
      providedContext={{
        organization: { organizationName },
        user: { name: userData?.user?.displayName },
        background: `Control implementation details for the provided request, use this information to answer the user's question or provide suggestions: ${JSON.stringify({
          name: title,
          details: implementation.details,
          status: implementation.status,
          verified: !!implementation.verified,
          implementationDate: implementation.implementationDate,
          linkedControls,
        })}`,
      }}
      contextKey={implementation.id}
      object={{ type: 'control implementation', name: title }}
    />
  )
}

export default ControlImplementationAskAI
