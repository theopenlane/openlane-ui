import { BaseCalloutPlugin } from '@platejs/callout'

import { CalloutElementStatic } from '@repo/ui/components/ui/callout-node-static.tsx'

export const BaseCalloutKit = [BaseCalloutPlugin.withComponent(CalloutElementStatic)]
