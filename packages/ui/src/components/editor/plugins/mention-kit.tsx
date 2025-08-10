'use client'

import { MentionInputPlugin, MentionPlugin } from '@platejs/mention/react'

import { MentionElement, MentionInputElement } from '@repo/ui/components/ui/mention-node.tsx'

export const MentionKit = [
  MentionPlugin.configure({
    options: { triggerPreviousCharPattern: /^$|^[\s"']$/ },
  }).withComponent(MentionElement),
  MentionInputPlugin.withComponent(MentionInputElement),
]
