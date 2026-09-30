import { useMemo } from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useIdentityHolderOptions } from '@/lib/graphql-hooks/identity-holder'
import { type CampaignTargetsNodeNonNull } from '@/lib/graphql-hooks/campaign-target'
import { useHasObjectType } from '@/lib/subscription-plan/hooks/use-module-access'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'

export type TRecipientLink = {
  id: string
  kind: ObjectAssociationNodeEnum.CONTACT | ObjectAssociationNodeEnum.IDENTITY_HOLDER
}

const CORE_MAX_RESULT_LIMIT = 100

const emailKey = (email: string) => email.trim().toLowerCase()

export const useRecipientLinks = (recipients: CampaignTargetsNodeNonNull[]) => {
  const hasPersonnel = useHasObjectType(ObjectTypes.IDENTITY_HOLDER)
  const emails = useMemo(() => [...new Set(recipients.filter((recipient) => !recipient.contact).map((recipient) => emailKey(recipient.email)))], [recipients])

  const { nodes: identityHolders } = useIdentityHolderOptions({
    where: { or: emails.map((email) => ({ emailEqualFold: email })) },
    pagination: { page: 1, pageSize: CORE_MAX_RESULT_LIMIT, query: { first: CORE_MAX_RESULT_LIMIT } },
    enabled: hasPersonnel && emails.length > 0,
  })

  return useMemo(() => {
    const identityHolderIdByEmail = new Map(identityHolders.map((holder) => [holder.email, holder.id]))
    const identityHolderIdByEmailKey = new Map(identityHolders.map((holder) => [emailKey(holder.email), holder.id]))
    const findIdentityHolderId = (email: string) => identityHolderIdByEmail.get(email) ?? identityHolderIdByEmailKey.get(emailKey(email))

    return new Map(
      recipients.flatMap((recipient): [string, TRecipientLink][] => {
        if (recipient.contact) {
          return [[recipient.id, { id: recipient.contact.id, kind: ObjectAssociationNodeEnum.CONTACT }]]
        }
        const identityHolderId = hasPersonnel ? findIdentityHolderId(recipient.email) : undefined
        return identityHolderId ? [[recipient.id, { id: identityHolderId, kind: ObjectAssociationNodeEnum.IDENTITY_HOLDER }]] : []
      }),
    )
  }, [recipients, identityHolders, hasPersonnel])
}
