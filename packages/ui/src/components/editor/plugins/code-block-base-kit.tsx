import { BaseCodeBlockPlugin, BaseCodeLinePlugin, BaseCodeSyntaxPlugin } from '@platejs/code-block'

import { CodeBlockElementStatic, CodeLineElementStatic, CodeSyntaxLeafStatic } from '@theopenlane/ui/components/ui/code-block-node-static.tsx'
import { lowlight } from '@theopenlane/ui/components/editor/lowlight-registry.ts'

export const BaseCodeBlockKit = [
  BaseCodeBlockPlugin.configure({
    node: { component: CodeBlockElementStatic },
    options: { lowlight },
  }),
  BaseCodeLinePlugin.withComponent(CodeLineElementStatic),
  BaseCodeSyntaxPlugin.withComponent(CodeSyntaxLeafStatic),
]
