'use client';

import { TogglePlugin } from '@platejs/toggle/react';

import { IndentKit } from '@repo/ui/components/editor/plugins/indent-kit.tsx';
import { ToggleElement } from '@repo/ui/components/ui/toggle-node.tsx';

export const ToggleKit = [
  ...IndentKit,
  TogglePlugin.withComponent(ToggleElement),
];
