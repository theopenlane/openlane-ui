import { BaseListPlugin } from '@platejs/list'
import { KEYS } from 'platejs'

import { BaseIndentKit } from '@theopenlane/ui/components/editor/plugins/indent-base-kit.tsx'
import { BlockListStatic } from '@theopenlane/ui/components/ui/block-list-static.tsx'

export const BaseListKit = [
  ...BaseIndentKit,
  BaseListPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock, KEYS.toggle],
    },
    render: {
      belowNodes: BlockListStatic,
    },
  }),
]
