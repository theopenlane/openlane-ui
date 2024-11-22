import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const colors = {
  aquamarine: {
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
  saffron: {
    50: '#FEFBF1',
    100: '#FDF5DD',
    200: '#FBEABC',
    300: '#F9E19F',
    400: '#F7D77D',
    500: '#F5CB5C',
    600: '#F1B91D',
    700: '#C0900C',
    800: '#7D5E08',
    900: '#3E2F04',
    950: '#221902',
  },
  glaucous: {
    '50': '#E2E7EE',
    '100': '#D1D9E5',
    '200': '#B4C1D5',
    '300': '#93A6C2',
    '400': '#768EB2',
    '500': '#5A76A0',
    '600': '#4A6082',
    '700': '#374862',
    '800': '#273344',
    '900': '#161D27',
    '950': '#0D1117',
  },
  firefly: {
    // dark green background from marketing site
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
  'river-bed': {
    // icon font color
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
  'carnation': {
    "50": '#fdf2f2',
    "100": '#fde8e8',
    "200": '#fbd5d5',
    "300": '#f8b4b4',
    "400": '#f98080',
    "500": '#f05252',
    "600": '#e02424',
    "700": '#c81e1e',
    "800": '#9b1c1c',
    "900": '#771d1d',
  },
  neutral: {
    "50": "#f1f7f9",
    "100": "#e1ecef",
    "200": "#c5d7dd",
    "300": "#aabec5",
    "400": "#92a4aa",
    "500": "#828a8c",
    "600": "#6e6e6e",
    "700": "#575757",
    "800": "#3d3d3d",
    "900": "#242424",
    "950": "#1a1a1a"
  }
}

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
        ...colors,
        primary: colors.aquamarine,
        secondary: colors.firefly,
        tertiary: colors.saffron,
        'util-red': colors.carnation,
        error: colors.carnation
      },
      fontFamily: {
        sans: ['var(--font-outfit)'],
        mono: ['var(--font-mono)'],
        serif: ['var(--font-mincho)'],
      },
    },
  },
}
export default config
