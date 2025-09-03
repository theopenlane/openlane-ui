import type { Config } from 'tailwindcss'
import sharedConfig from '@repo/tailwind-config'
import containerQueries from '@tailwindcss/container-queries'

const config: Pick<Config, 'darkMode' | 'content' | 'presets' | 'prefix' | 'theme' | 'safelist' | 'mode' | 'plugins'> = {
  mode: 'jit',
  darkMode: 'class',
  safelist: ['dark', 'bg-red-50', 'bg-green-50', 'bg-yellow-50', 'bg-red-200', 'bg-green-200', 'bg-yellow-500', 'text-red-700', 'text-green-700', 'text-slate-700'],
  content: ['./src/app/**/*.tsx', './src/components/**/*.tsx'],
  presets: [sharedConfig as Partial<Config>],
  plugins: [containerQueries],
  theme: {
    extend: {
      colors: {
        'regal-blue': '#0D1117',
        brand: {
          DEFAULT: 'var(--color-brand)',
          secondary: 'var(--color-brand-secondary)',
          100: 'var(--color-brand-100)',
          900: 'var(--color-brand-900)',
        },
        standard: {
          iso27001: 'var(--color-iso27001)',
          nist80053: 'var(--color-nist80053)',
          nistcsf: 'var(--color-nistcsf)',
          soc2: 'var(--color-soc2)',
          nistssdf: 'var(--color-nistssdf)',
          gdpr: 'var(--color-gdpr)',
          cis: 'var(--color-cis)',
          ccm: 'var(--color-ccm)',
          hipaa: 'var(--color-hipaa)',
          sox: 'var(--color-sox)',
          pci: 'var(--color-pci)',
          custom: 'var(--color-custom)',
          masvs: 'var(--color-masvs)',
          ccpa: 'var(--color-ccpa)',
          nerc: 'var(--color-nerc)',
          cobit: 'var(--color-cobit)',
          fed: 'var(--color-fed)',
        },
        object: {
          procedures: 'var(--color-procedures)',
          tasks: 'var(--color-tasks)',
          programs: 'var(--color-programs)',
          risks: 'var(--color-risks)',
          controls: 'var(--color-controls)',
          subcontrols: 'var(--color-subcontrols)',
          controlObjectives: 'var(--color-control-objectives)',
          policies: 'var(--color-policies)',
          groups: 'var(--color-groups)',
          evidence: 'var(--color-evidence)',
        },
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
    },
    animation: {
      'accordion-down': 'accordion-down 0.2s ease-out',
      'accordion-up': 'accordion-up 0.2s ease-out',
    },
  },
}

export default config
