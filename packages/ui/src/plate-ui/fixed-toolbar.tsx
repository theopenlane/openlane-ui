'use client';

import { withCn } from '@udecode/cn';

import { Toolbar } from './toolbar';

export const FixedToolbar = withCn(
  Toolbar,
  'supports-backdrop-blur:bg-white/60 sticky left-0 top-0 z-50 w-full justify-between overflow-x-auto rounded-t-lg border-b border-b-border bg-white/95 p-1 backdrop-blur dark:supports-backdrop-blur:bg-oxford-blue-950/60 dark:bg-oxford-blue-950/95'
);
