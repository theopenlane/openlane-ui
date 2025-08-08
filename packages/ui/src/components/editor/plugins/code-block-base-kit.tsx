import { BaseCodeBlockPlugin, BaseCodeLinePlugin, BaseCodeSyntaxPlugin } from '@platejs/code-block'
import { all, createLowlight } from 'lowlight'

import { CodeBlockElementStatic, CodeLineElementStatic, CodeSyntaxLeafStatic } from '@repo/ui/components/ui/code-block-node-static.tsx'

const lowlight = createLowlight(all)

export const BaseCodeBlockKit = [
  BaseCodeBlockPlugin.configure({
    node: { component: CodeBlockElementStatic },
    options: { lowlight },
  }),
  BaseCodeLinePlugin.withComponent(CodeLineElementStatic),
  BaseCodeSyntaxPlugin.withComponent(CodeSyntaxLeafStatic),
]
