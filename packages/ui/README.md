# @theopenlane/ui

React primitives and the Tailwind CSS v4 theme used by the [Openlane](https://www.theopenlane.io) console.

## Install

```sh
npm install @theopenlane/ui
```

See `peerDependencies` in `package.json` for the required versions. The optional peers are needed only by the components that use them: `logo` and `breadcrumb` need `next`, `logo` needs `next-themes`, and `form` needs `react-hook-form`.

## Styles

Import the theme once, from the stylesheet Tailwind processes in your app:

```css
@import '@theopenlane/ui/styles.css';
```

It brings in Tailwind, the Openlane design tokens and the class names the components use.

The theme's `font-sans` is Outfit, which the package does not ship. Load it yourself and put `font-sans` on `<body>`, for example with `next/font/google`'s `Outfit({ subsets: ['latin'] })`.

## Usage

Every component has its own entry point:

```tsx
import { Button } from '@theopenlane/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@theopenlane/ui/dialog'
import { cn } from '@theopenlane/ui/lib/utils'
```

Interactive components are marked `'use client'`, so they can be rendered from React Server Components.

## Releases

Published from `packages/ui` in [theopenlane/openlane-ui](https://github.com/theopenlane/openlane-ui) when a `ui-v<version>` tag is pushed.
