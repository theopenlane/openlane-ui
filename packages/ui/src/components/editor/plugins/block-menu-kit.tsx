'use client';

import { BlockMenuPlugin } from '@platejs/selection/react';

import { BlockContextMenu } from '@repo/ui/components/ui/block-context-menu.tsx';

import { BlockSelectionKit } from './block-selection-kit';

export const BlockMenuKit = [
  ...BlockSelectionKit,
  BlockMenuPlugin.configure({
    render: { aboveEditable: BlockContextMenu },
  }),
];
