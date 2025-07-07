import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config'
import type { Config } from 'tailwindcss'

const resolved = resolveConfig(tailwindConfig as Config)

export const fullConfig = resolved as unknown as {
  theme: {
    colors: {
      java: Record<number, string>
    }
    fontSize: Record<string, [string, Record<string, string>]>
    spacing: Record<string, string>
  }
}

export function tailwindToPdfStyles(overrides = {}) {
  const defaultStyles = {
    textColor: fullConfig.theme.colors.java[800],
    borderColor: fullConfig.theme.colors.java[200],
    logoWidth: 120,
    logoHeight: 35,
  }

  return {
    ...defaultStyles,
    ...overrides,
  }
}
