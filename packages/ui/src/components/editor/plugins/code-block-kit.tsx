'use client'

import { CodeBlockRules } from '@platejs/code-block'
import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from '@platejs/code-block/react'

import { CodeBlockElement, CodeLineElement, CodeSyntaxLeaf } from '@repo/ui/components/ui/code-block-node.tsx'
import { lowlight } from '@repo/ui/components/editor/lowlight-registry.ts'

export const CodeBlockKit = [
  CodeBlockPlugin.configure({
    inputRules: [CodeBlockRules.markdown({ on: 'match' })],
    node: { component: CodeBlockElement },
    options: { lowlight },
    shortcuts: { toggle: { keys: 'mod+alt+8' } },
  }),
  CodeLinePlugin.withComponent(CodeLineElement),
  CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),
]
