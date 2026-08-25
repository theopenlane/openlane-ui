import type { Page, Locator } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * File-upload helpers + committed sample fixtures (e2e/fixtures/files/).
 * Use for evidence / document / bulk-CSV upload specs.
 */

const FILES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'files')

export const fixtureFile = (name: string): string => path.join(FILES_DIR, name)

export const SAMPLE_PDF = fixtureFile('sample.pdf')
export const SAMPLE_PNG = fixtureFile('sample.png')
export const SAMPLE_CSV = fixtureFile('sample.csv')
// A disallowed type, for negative "wrong file type is rejected" assertions.
export const SAMPLE_DISALLOWED = fixtureFile('sample.exe')

/**
 * Set files on a file input. Pass an explicit input locator when the page has
 * more than one; otherwise the first input[type=file] is used. File inputs are
 * often visually hidden, so this does not assert visibility.
 */
export const uploadFiles = async (page: Page, files: string | string[], input?: Locator): Promise<void> => {
  const target = input ?? page.locator('input[type="file"]').first()
  await target.setInputFiles(files)
}
