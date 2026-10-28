import { buildDevRevPayload } from './devrev-payload'

describe('buildDevRevPayload', () => {
  it('creates an org-scoped identity from trusted organization data', () => {
    const payload = buildDevRevPayload({
      currentOrgId: 'org-2',
      organization: {
        name: 'acme-and-sons',
        displayName: 'Acme & Sons #2',
      },
      user: {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
      },
    })

    expect(payload).toEqual({
      rev_info: {
        user_ref: 'user-1:org-2',
        account_ref: 'acme-and-sons',
        user_traits: {
          email: 'test@example.com',
          display_name: 'Test User',
        },
        account_traits: {
          display_name: 'Acme & Sons #2',
          custom_fields: {
            tnt__orgid: 'org-2',
          },
        },
      },
    })
  })
})
