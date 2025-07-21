import { BaseLinkPlugin } from '@platejs/link';

import { LinkElementStatic } from '@repo/ui/components/ui/link-node-static.tsx';

export const BaseLinkKit = [BaseLinkPlugin.withComponent(LinkElementStatic)];
