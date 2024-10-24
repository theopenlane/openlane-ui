import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config'

export const fullConfig = resolveConfig(tailwindConfig) as {
  theme: {
    colors: Record<string, any>
    fontSize: Record<string, any>
    spacing: Record<string, any>
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
