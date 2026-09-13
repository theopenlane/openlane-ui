type DevRevPayloadInput = {
  currentOrgId: string
  organization: {
    displayName: string
    name: string
  }
  user: {
    displayName?: string | null
    email?: string | null
    id: string
  }
}

export const buildDevRevPayload = ({ currentOrgId, organization, user }: DevRevPayloadInput) => ({
  rev_info: {
    user_ref: `${user.id}:${currentOrgId}`,
    account_ref: organization.name,
    user_traits: {
      email: user.email,
      display_name: user.displayName,
    },
    account_traits: {
      display_name: organization.displayName,
      custom_fields: {
        tnt__orgid: currentOrgId,
      },
    },
  },
})
