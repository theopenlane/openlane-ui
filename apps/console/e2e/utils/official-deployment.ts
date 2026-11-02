import type { Page } from '@playwright/test'

// the unofficial deployment banner only renders when the console is not on an official host
export const isUnofficialDeployment = (page: Page): Promise<boolean> =>
  page
    .getByText('Unofficial Openlane deployment.')
    .isVisible()
    .catch(() => false)
