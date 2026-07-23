import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REACT_PACKAGES = ['react', 'react-dom']
const INSTALLED_DEPENDENCY_SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies']
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

export const getReactVersionErrors = ({ rootManifest, workspaceManifests, installedVersions }) => {
  const errors = []
  const pinnedReact = rootManifest.resolutions?.react
  const pinnedReactDOM = rootManifest.resolutions?.['react-dom']

  if (!EXACT_VERSION.test(pinnedReact ?? '')) {
    errors.push('package.json resolutions.react must be an exact version')
  }

  if (!EXACT_VERSION.test(pinnedReactDOM ?? '')) {
    errors.push('package.json resolutions.react-dom must be an exact version')
  }

  if (pinnedReact && pinnedReactDOM && pinnedReact !== pinnedReactDOM) {
    errors.push(`package.json resolutions mismatch: react=${pinnedReact}, react-dom=${pinnedReactDOM}`)
  }

  const manifests = [{ path: 'package.json', manifest: rootManifest }, ...workspaceManifests]

  for (const { path, manifest } of manifests) {
    for (const section of INSTALLED_DEPENDENCY_SECTIONS) {
      for (const packageName of REACT_PACKAGES) {
        const declaredVersion = manifest[section]?.[packageName]

        if (declaredVersion && pinnedReact && declaredVersion !== pinnedReact) {
          errors.push(`${path} ${section}.${packageName}=${declaredVersion}, expected ${pinnedReact}`)
        }
      }
    }

    for (const packageName of REACT_PACKAGES) {
      const peerVersion = manifest.peerDependencies?.[packageName]

      if (peerVersion && EXACT_VERSION.test(peerVersion) && pinnedReact && peerVersion !== pinnedReact) {
        errors.push(`${path} peerDependencies.${packageName}=${peerVersion}, expected ${pinnedReact}`)
      }
    }
  }

  for (const packageName of REACT_PACKAGES) {
    const installedVersion = installedVersions[packageName]

    if (!installedVersion) {
      errors.push(`node_modules/${packageName} is not installed at the workspace root`)
    } else if (pinnedReact && installedVersion !== pinnedReact) {
      errors.push(`installed ${packageName}=${installedVersion}, expected ${pinnedReact}`)
    }
  }

  return errors
}

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

const readWorkspaceManifests = async (rootDirectory, workspacePatterns) => {
  const manifests = []

  for (const pattern of workspacePatterns) {
    if (!pattern.endsWith('/*')) throw new Error(`Unsupported workspace pattern: ${pattern}`)

    const workspaceRoot = join(rootDirectory, pattern.slice(0, -2))
    const entries = await readdir(workspaceRoot, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const relativePath = join(pattern.slice(0, -2), entry.name, 'package.json')
      manifests.push({ path: relativePath, manifest: await readJson(join(rootDirectory, relativePath)) })
    }
  }

  return manifests
}

const readInstalledVersions = async (rootDirectory) => {
  const versions = {}

  for (const packageName of REACT_PACKAGES) {
    try {
      versions[packageName] = (await readJson(join(rootDirectory, 'node_modules', packageName, 'package.json'))).version
    } catch {
      versions[packageName] = null
    }
  }

  return versions
}

const main = async () => {
  const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const rootManifest = await readJson(join(rootDirectory, 'package.json'))
  const workspaceManifests = await readWorkspaceManifests(rootDirectory, rootManifest.workspaces)
  const installedVersions = await readInstalledVersions(rootDirectory)
  const errors = getReactVersionErrors({ rootManifest, workspaceManifests, installedVersions })

  if (errors.length) {
    console.error(['React version validation failed:', ...errors.map((error) => `- ${error}`)].join('\n'))
    process.exitCode = 1
    return
  }

  console.log(`React and ReactDOM are aligned at ${rootManifest.resolutions.react}.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
