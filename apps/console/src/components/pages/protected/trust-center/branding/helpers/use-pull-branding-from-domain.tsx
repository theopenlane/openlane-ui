'use client'

import Link from 'next/link'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { TRUST_CENTER_QUERY_KEY } from '@/lib/graphql-hooks/trust-center'
import { useNotification } from '@/hooks/useNotification'
import { useDomainBrandingScan, type TBrandDesignApplyTargets } from '@/components/shared/domain-branding/use-domain-branding-scan'

const BRANDING_THEME_HREF = '/trust-center/branding#theme'

const APPLY_TO_PREVIEW: TBrandDesignApplyTargets = { applyBrandDesignToPreview: true }

export const usePullBrandingFromDomain = (onPulled: () => void) => {
  const { queryClient } = useGraphQLClient()
  const { successNotification } = useNotification()

  return useDomainBrandingScan({
    applyTo: APPLY_TO_PREVIEW,
    onBrandingFound: (_branding, domain) => {
      queryClient.invalidateQueries({ queryKey: TRUST_CENTER_QUERY_KEY, exact: true }).then(onPulled)
      successNotification({
        title: 'Branding pulled',
        description: (
          <span>
            {`We finished reading ${domain}. `}
            <Link href={BRANDING_THEME_HREF} className="text-primary font-medium underline">
              Review your preview settings
            </Link>
            {', then publish when you are happy with them.'}
          </span>
        ),
      })
    },
  })
}
