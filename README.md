# Openlane UI

Openlane UI monorepo which holds all the frontend assets for Openlane

## What's inside?

This monorepo is run on [Bun](https://bun.sh/) and built using
[Turborepo](https://turbo.build/repo/). It includes the following packages/apps:

### Apps and Packages

#### Applications

- `console`: [Openlane Console](https://console.theopenlane.io/)
- `storybook`: [Storybook Components](https://storybook.theopenlane.io/)

#### Packages

- `@repo/codegen`: Generated graphQL functions using `urql` to make requests to
  the Openlane graphql api. See the [README](packages/codegen/README.md) for
  details.
- `@repo/ui`: UI component library shared by our applications
- `@repo/dally`: DAL library for sharing common patterns and functionality in
  our other apps
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next`
  and `eslint-config-prettier`)
- `@repo/config-typescript`: `tsconfig.json`s used throughout the monorepo
- `@repo/tailwind-config`: the `tailwind.config.ts` used throughout the monorepo

## Stack

- [TypeScript](https://www.typescriptlang.org/) for static type-checking
- [Bun](https://bun.sh/) to bundle, dev, test, deploy and run apps
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Next.js](https://nextjs.org/) a framework to help with building web
  applications using React
- [React](https://react.dev/) for creating user interfaces
- [SWR](https://swr.vercel.app/) for client-side data fetching, caching, and
  de-deduping API requests
- [Tailwindcss](https://tailwindcss.com/) for styles without leaving TSX syntax

## Prerequisites

1. Install Bun and other dependencies:
   ```bash
   task local-setup
   ```

The above should work on macOS/Linux environments. If you are using Windows you
may need to look at the [Taskfile](Taskfile.yaml) and find the equivalent
commands.

## Build

To build all apps and packages, run the following commands:

```bash
task install
task build
```

## Develop

1. Copy the .env, this is in .gitignore so you do not have to worry about
   accidentally committing it. This hold example of environment configurations
   which you should review and potentially override depending on your needs.
   ```bash
   cp ./config/.env-example ./config/.env
   ```

1. To develop all apps and packages, run the following command:

   ```bash
   task dev
   ```

1. Alternatively, you can run a single app instead of all the apps with the
   specific task commands. For example to develop on the console app run:

   ```
   task dev:console
   ```

### API Backend

The backend used by the console UI is located in the Open
[core repo](https://github.com/theopenlane/core). Please refer to the
[README](https://github.com/theopenlane/core?tab=readme-ov-file#development) in
that repository for details on standing up the api locally.

## Contributing

See the [contributing](.github/CONTRIBUTING.md) guide for more information.
