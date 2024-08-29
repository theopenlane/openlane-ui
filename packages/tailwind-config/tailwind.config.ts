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
        blackberry: {
          900: '#312847',
          800: '#443A5B',
          700: '#62587A',
          600: '#72688C',
          500: '#9C94B0',
          400: '#BBB5C6',
          300: '#D5D1DC',
          200: '#DFDCE5',
          100: '#ECEBEF',
          50: '#F5F5F7',
        },
        'mulled-wine': {
          900: '#564663',
        },
        peat: {
          900: '#383238',
          800: '#4C464C',
          700: '#625B62',
          600: '#7A727A',
          500: '#908990',
          400: '#A5A1A5',
          300: '#CBC7CB',
          200: '#EAE8EA',
          100: '#F3F3F3',
          50: '#F9FAFB',
        },
        tangerine: {
          900: '#F08C00',
        },
        sunglow: {
          900: '#F27A67',
          800: '#F39182',
          700: '#F4A79A',
          600: '#FABBB1',
          500: '#FAC7BE',
          400: '#F7D3CD',
          300: '#F8DFDB',
          200: '#F3E6E4',
          100: '#F4EDEB',
          50: '#F9F7F6',
        },
        'winter-sky': {
          900: '#E1EBEA',
          800: '#EEF3F2',
          700: '#F7FAFA',
        },
        'util-green': {
          900: '#014737',
          800: '#03543F',
          700: '#046C4E',
          600: '#057A55',
          500: '#0E9F6E',
          400: '#31C48D',
          300: '#84E1BC',
          200: '#BCF0DA',
          100: '#DEF7EC',
          50: '#F3FAF7',
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
        sans: ['var(--font-ftRegola)'],
        mono: ['var(--font-karelia)'],
        serif: ['var(--font-FAMAime)'],
      },
    },
  },
}
export default config
