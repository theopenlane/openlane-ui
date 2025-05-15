import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'
import assistantUI from '@assistant-ui/react/tailwindcss'

export const config: Partial<Config> = {
  darkMode: 'class', // Enable dark mode via class
  plugins: [
    forms,
    function ({ addVariant }: { addVariant: (name: string, value: string[]) => void }) {
      addVariant('dark-hover', ['@media (prefers-color-scheme: dark)', '&:hover']) // Custom dark-hover variant
    },
    assistantUI({
      components: ['assistant-modal'],
      shadcn: true,
    }),
  ],
  theme: {
    extend: {
      // ** Keyframes and Animations **
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
        'accordion-down': 'accordion-down var(--animation-duration) var(--animation-easing)',
        'accordion-up': 'accordion-up var(--animation-duration) var(--animation-easing)',
      },

      backgroundColor: (theme: any) => ({
        ...theme('colors'),
        DEFAULT: 'var(--color-bg)', // Override default background color
        muted: 'var(--color-bg-muted)', // Muted background color
        light: 'var(--color-bg-light)', // Light background color
        dark: 'var(--color-bg-dark)', // Dark background color
        primary: 'var(--color-bg-primary)', // Primary background color
        secondary: 'var(--color-bg-secondary)', // Secondary background color
      }),

      foregroundColor: (theme: any) => ({
        ...theme('colors'),
        DEFAULT: 'var(--color-text-paragraph)', // Default text color
        header: 'var(--color-text-header)', // Header text color
        paragraph: 'var(--color-text-paragraph)', // Paragraph text color
        dark: 'var(--color-text-dark)', // Dark text color
        light: 'var(--color-text-light)', // Light text color
        dimmed: 'var(--color-text-dimmed)', // dimmed text color
      }),

      borderColor: (theme: any) => ({
        ...theme('colors'),
        DEFAULT: 'var(--color-border)', // Default border color
        light: 'var(--color-border-light)', // Light border color
        dark: 'var(--color-border-dark)', // Dark border color
      }),

      colors: {
        background: {
          DEFAULT: 'var(--color-bg)',
          dark: 'var(--color-bg-dark)',
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
        },
        text: {
          DEFAULT: 'var(--color-text-paragraph)', // Default text
          header: 'var(--color-text-header)', // Header text
          paragraph: 'var(--color-text-paragraph)', // Paragraph text
          dark: 'var(--color-text-dark)', // Dark text
          light: 'var(--color-text-light)', // Light text
          navlink: 'var(--color-text-nav-link)', // Navigation link text
          dimmed: 'var(--color-text-dimmed)', // dimmed text color
        },
        button: {
          DEFAULT: 'var(--color-button)', // Button background
          muted: 'var(--color-button-muted)', // Muted button background
          light: 'var(--color-button-light)', // Button background always light
          text: 'var(--color-button-text)', // Button text
          secondary: 'var(--color-button-secondary)', // Secondary button background
          back: 'var(--color-button-back)',
        },
        panel: {
          DEFAULT: 'var(--color-panel-bg)', // Panel background
          bg: 'var(--color-panel-bg)', // Panel background
          text: 'var(--color-panel-text)', // Panel text
        },
        card: {
          DEFAULT: 'var(--color-card-bg)', // Card background
          bg: 'var(--color-card-bg)', // Card background
          text: 'var(--color-card-text)', // Card text
        },
        separator: {
          DEFAULT: 'var(--color-separator)', // separator color
          dark: 'var(--color-separator-dark)', // Dark separator color
          light: 'var(--color-separator-light)', // Light separator color
        },
        'separator-edit': {
          DEFAULT: 'var(--color-separator-edit)',
          dark: 'var(--color-separator-edit-dark)',
          light: 'var(--color-separator-edit-light)',
        },
        border: {
          DEFAULT: 'var(--color-border)', // Border color
          light: 'var(--color-border-light)', // Light border color
          dark: 'var(--color-border-dark)', // Dark border color
          input: 'var(--color-border-input)',
        },
        gradient: {
          light: 'var(--color-gradient-light)', // Gradient in light mode
          dark: 'var(--color-gradient-dark)', // Gradient in dark mode
        },
        brand: {
          primary: 'var(--color-brand)', // Primary brand color
          secondary: 'var(--color-brand-secondary)', // Secondary brand color
        },
        logo: {
          background: 'var(--color-logo-bg)', // Logo background
          foreground: 'var(--color-logo-fg)', // Logo foreground
          text: 'var(--color-logo-text)', // Logo text
          dark: 'var(--color-logo-dark)', // Dark logo color
          light: 'var(--color-logo-light)', // Light logo color
        },
        login: {
          bg: 'var(--color-login-bg)', // Login background
          text: 'var(--color-login-text)', // Login text
        },
        popover: {
          DEFAULT: 'var(--color-popover)', // Popover background
        },
        tags: {
          bg: 'var(--color-tags-bg)', // Tag background
          text: 'var(--color-tags-text)', // Tag text
          border: 'var(--color-tags-border)', // Tag border
        },
        accent: {
          DEFAULT: 'var(--color-accent)', // Accent color, used for highlighting
          muted: 'var(--color-accent-muted)', // Muted accent color
        },
        'accent-secondary': {
          DEFAULT: 'var(--color-accent-secondary)', // Secondary accent color
          muted: 'var(--color-accent-secondary-muted)', // Muted secondary accent color
        },
        ring: {
          DEFAULT: 'var(--color-ring)', // Ring color
        },
        success: {
          DEFAULT: 'var(--color-status-success)', // Success color
          muted: 'var(--color-status-success-muted)', // Muted success color
        },
        warning: {
          DEFAULT: 'var(--color-status-warning)', // Warning color
          muted: 'var(--color-status-warning-muted)', // Muted warning color
        },
        error: {
          DEFAULT: 'var(--color-status-error)', // Error color
          muted: 'var(--color-status-error-muted)', // Muted error color
        },
        info: {
          DEFAULT: 'var(--color-status-info)', // Info color
          muted: 'var(--color-status-info-muted)', // Muted info color
        },
        table: {
          bg: 'var(--color-table-bg)', // Table background
          text: 'var(--color-table-text)', // Table text
          'row-bg-odd': 'var(--color-table-row-bg-odd)', // Odd row background
          'row-bg-even': 'var(--color-table-row-bg-even)', // Even row background
          'row-bg-hover': 'var(--color-table-row-bg-hover)',
          border: 'var(--color-table-border)', // Table border
          'border-muted': 'var(--color-table-border-muted)', // Muted table border
          'header-bg': 'var(--color-table-header-bg)', // Table header background
          header: 'var(--color-table-header-text)', // Table header text
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          transparent: 'var(--color-destructive-transparent)',
          border: 'var(--color-destrucitve-border)',
          foreground: 'var(--destructive-foreground)',
        },
        progressbar: {
          DEFAULT: 'var(--color-progressbar-empty)',
        },
        input: {
          background: 'var(--color-input-background)',
          text: 'var(--color-input-text)',
        },
        note: {
          DEFAULT: 'var(--color-warning-muted-more)',
        },
        banner: {
          DEFAULT: 'var(--color-warning-banner)',
        },
        auth: {
          DEFAULT: 'var(--color-background-auth)',
        },
        'task-complete': '#2CCBAB',
        'task-in-progress': '#EAB308',
        'task-in-review': '#EAB308',
        'task-open': '#2CCBAB',
        'task-wont-do': '#c70000',

        // Other Palette Colors
        teal: {
          50: '#E8F9F5',
          100: '#D0F3EA',
          200: '#A3E3D4',
          300: '#75D2BF',
          400: '#4DC6AD',
          500: '#2CCBAB',
          600: '#24A48B',
          700: '#1C8170',
          800: '#146355',
          900: '#0D4138',
          950: '#05211D',
        },
        jade: {
          50: '#EAF9F9',
          100: '#D1F3F3',
          200: '#A8E4E4',
          300: '#7AD4D4',
          400: '#59C1BB',
          500: '#4AA5A0',
          600: '#3C8783',
          700: '#2F6967',
          800: '#244D4C',
          900: '#193231',
          950: '#0F1A19',
        },
        mauve: {
          50: '#F5F2F6',
          100: '#EDE2F0',
          200: '#D7C6E2',
          300: '#B9A0CC',
          400: '#998DA0',
          500: '#857080',
          600: '#6C5865',
          700: '#55434E',
          800: '#3E2F3A',
          900: '#271D24',
          950: '#140E12',
        },
        saffron: {
          50: '#FEF9ED',
          100: '#FEF0D8',
          200: '#FDE0AE',
          300: '#FBD079',
          400: '#F5CB5C',
          500: '#D9AE40',
          600: '#B48F31',
          700: '#8F6F26',
          800: '#6A521C',
          900: '#473813',
          950: '#241C0A',
        },
        glaucous: {
          50: '#E2E7EE',
          100: '#D1D9E5',
          200: '#B4C1D5',
          300: '#93A6C2',
          400: '#768EB2',
          500: '#5A76A0',
          600: '#4A6082',
          700: '#374862',
          800: '#273344',
          900: '#161D27',
          950: '#0D1117',
        },
        'oxford-blue': {
          50: '#f2f7f9',
          100: '#dfeaee',
          200: '#c2d7df',
          300: '#98bac8',
          400: '#6694aa',
          500: '#4b788f',
          600: '#416379',
          700: '#395365',
          800: '#354755',
          900: '#303e4a',
          950: '#1c2630',
        },
        neutral: {
          50: '#f1f7f9',
          100: '#e1ecef',
          200: '#c5d7dd',
          300: '#aabec5',
          400: '#92a4aa',
          500: '#828a8c',
          600: '#6e6e6e',
          700: '#575757',
          800: '#3d3d3d',
          900: '#242424',
          950: '#1a1a1a',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(90deg, #09f1c7 0%, #59c1bb 100%)',
        'gradient-dark': 'linear-gradient(90deg, #0D1117 0%, #161D27 100%)',
      },

      // ** Shadows **
      boxShadow: {
        auth: '0px 8.671px 17.343px -8.671px rgba(0, 0, 0, 0.10)',
        popover: '0px 8.671px 17.343px -8.671px rgba(0, 0, 0, 0.10)',
      },

      // ** Typography and Letter Spacing **
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
        heading: ['var(--font-outfit)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        serif: ['var(--font-mincho)', 'serif'],
      },
      fontWeight: {
        body: 400,
        heading: 700,
      },
      letterSpacing: {
        tighter: '-0.01rem',
        heading: '-0.038rem',
      },
    },
  },
}

export default config
