import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export const config: Omit<Config, 'content'> = {
  plugins: [forms],
  theme: {
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
      boxShadow: {
        auth: '0px 8.671px 17.343px -8.671px rgba(0, 0, 0, 0.10)',
        popover: '0px 8.671px 17.343px -8.671px rgba(0, 0, 0, 0.10)',
      },
      letterSpacing: {
        tighter: '-0.01rem',
        heading: '-0.038rem',
      },
      colors: {
        aquamarine: { // bright green, button styles
          '50': '#e8fff9',
          '100': '#c8ffef',
          '200': '#96ffe4',
          '300': '#53ffdd',
          '400': '#09f1c7', // button color 
          '500': '#00deb7',
          '600': '#00b696',
          '700': '#00927d',
          '800': '#007364',
          '900': '#005e54',
          '950': '#003531',
        },
        java: {
            '50': '#f2fbfa',
            '100': '#d3f4ef',
            '200': '#a7e8df',
            '300': '#74d4cc',
            '400': '#59c1bb', // brand 2 from marketing site
            '500': '#2d9f9a',
            '600': '#227f7d',
            '700': '#1f6666',
            '800': '#1d5152',
            '900': '#1c4545',
            '950': '#0b2628',
        },
        ziggurat: {
            '50': '#f5f9fa',
            '100': '#e9f1f5', // background color in light mode
            '200': '#bdd9e1', // font color in dark mode
            '300': '#a3cbd6',
            '400': '#72b0be',
            '500': '#5097a7',
            '600': '#3d7b8c',
            '700': '#336371',
            '800': '#2d545f',
            '900': '#2a4750', // background of panels/tables/etc. in dark mode
            '950': '#1c2e35',
        },
        firefly: { // dark green background from marketing site
            '50': '#edfefd',
            '100': '#d1fcfb',
            '200': '#a9f8f7',
            '300': '#6ef1f2',
            '400': '#2ce0e4',
            '500': '#10c3ca',
            '600': '#109daa',
            '700': '#147d8a',
            '800': '#1a6570',
            '900': '#1a535f',
            '950': '#082930', // font color in light mode
        },
        'river-bed': { // icon font color
          '50': '#f4f6f7',
          '100': '#e3e8ea',
          '200': '#c9d2d8',
          '300': '#a4b2bc',
          '400': '#778a99',
          '500': '#5c6f7e',
          '600': '#4f5e6b',
          '700': '#46515c',
          '800': '#3d444d',
          '900': '#363b43',
          '950': '#21252b',
      },
        'oxford-blue': { 
            '50': '#f2f7f9',
            '100': '#dfeaee',
            '200': '#c2d7df',
            '300': '#98bac8',
            '400': '#6694aa',
            '500': '#4b788f',
            '600': '#416379',
            '700': '#395365',
            '800': '#354755',
            '900': '#303e4a', // background color in dark mode
            '950': '#1c2630',
        },
        'util-red': {
          900: '#771D1D',
          800: '#9B1C1C',
          700: '#C81E1E',
          600: '#E02424',
          500: '#F05252',
          400: '#F98080',
          300: '#F8B4B4',
          200: '#FBD5D5',
          100: '#FDE8E8',
          50: '#FDF2F2',
        },
      },
      fontFamily: {
        sans: ['var(--font-outfit)'],
        mono: ['var(--font-outfit)'],
        serif: ['var(--font-mincho)'],
      },
    },
  },
}
export default config
