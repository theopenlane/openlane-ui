export const DESIRED_SCOPE_NAMES = ['in-scope', 'out-of-scope', 'future-scope']
export const DESIRED_ENVIRONMENT_NAMES = ['production', 'development']
export const DEFAULT_PLATFORM_SCOPE = 'in-scope'
export const DEFAULT_PLATFORM_ENVIRONMENT = 'production'

// default chip colors for the scope/environment values above when they're auto-created
export const SCOPE_COLORS: Record<string, string> = {
  'in-scope': '#10b981', // Green
  'out-of-scope': '#6b7280', // Grey
  'future-scope': '#3b82f6', // Blue
}
export const ENVIRONMENT_COLORS: Record<string, string> = {
  production: '#6366f1', // Indigo
  development: '#f59e42', // Orange
}
