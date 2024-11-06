import type { Config } from 'tailwindcss'
import sharedConfig from '@repo/tailwind-config'
import tailwindAnimate from 'tailwindcss-animate'
import plugin from 'tailwindcss/plugin';
import typography from '@tailwindcss/typography';

const config: Pick<
  Config,
  'prefix' | 'content' | 'presets' | 'extend' | 'plugins' | 'darkMode' | 'mode' | 'theme'
> = {
  mode: 'jit',
  darkMode: ['class'],
  content: ['./src/**/*.tsx'],
  presets: [sharedConfig],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			brand: {
  				DEFAULT: 'hsl(var(--brand))',
  				foreground: 'hsl(var(--brand-foreground))'
  			},
  			highlight: {
  				DEFAULT: 'hsl(var(--highlight))',
  				foreground: 'hsl(var(--highlight-foreground))'
  			}
      },
    }
  },
  plugins: [
    tailwindAnimate,
    typography,
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.transition-bg-ease': {
          'transition-duration': '20ms',
          'transition-property': 'background-color',
          'transition-timing-function': 'ease-in',
        },
      });
    }),
  ],
  extend: {
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
    animation: {
      'accordion-down': 'accordion-down 0.2s ease-out',
      'accordion-up': 'accordion-up 0.2s ease-out',
    },
  },
}

export default config
