'use client'

import { ColumnItemPlugin, ColumnPlugin } from '@platejs/layout/react'

import { ColumnElement, ColumnGroupElement } from '@theopenlane/ui/components/ui/column-node.tsx'

export const ColumnKit = [ColumnPlugin.withComponent(ColumnGroupElement), ColumnItemPlugin.withComponent(ColumnElement)]
