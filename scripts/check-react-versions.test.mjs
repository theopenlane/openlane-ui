import assert from 'node:assert/strict'
import test from 'node:test'
import { getReactVersionErrors } from './check-react-versions.mjs'

const validInput = () => ({
  rootManifest: {
    resolutions: { react: '19.2.7', 'react-dom': '19.2.7' },
    peerDependencies: { react: '19.2.7', 'react-dom': '19.2.7' },
  },
  workspaceManifests: [
    {
      path: 'apps/console/package.json',
      manifest: { dependencies: { react: '19.2.7', 'react-dom': '19.2.7' } },
    },
  ],
  installedVersions: { react: '19.2.7', 'react-dom': '19.2.7' },
})

test('accepts aligned React and ReactDOM versions', () => {
  assert.deepEqual(getReactVersionErrors(validInput()), [])
})

test('rejects mismatched root resolutions', () => {
  const input = validInput()
  input.rootManifest.resolutions['react-dom'] = '19.2.6'

  assert.ok(getReactVersionErrors(input).some((error) => error.includes('resolutions mismatch')))
})

test('rejects a drifting workspace dependency', () => {
  const input = validInput()
  input.workspaceManifests[0].manifest.dependencies['react-dom'] = '19.2.6'

  assert.ok(getReactVersionErrors(input).some((error) => error.includes('apps/console/package.json')))
})

test('rejects mismatched installed packages', () => {
  const input = validInput()
  input.installedVersions['react-dom'] = '19.2.6'

  assert.ok(getReactVersionErrors(input).some((error) => error.includes('installed react-dom=19.2.6')))
})
