'use client'

import { TogglePlugin } from '@platejs/toggle/react'

import { IndentKit } from '@theopenlane/ui/components/editor/plugins/indent-kit.tsx'
import { ToggleElement } from '@theopenlane/ui/components/ui/toggle-node.tsx'

export const ToggleKit = [...IndentKit, TogglePlugin.withComponent(ToggleElement)]
