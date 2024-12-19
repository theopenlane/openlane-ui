import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    {
      directory: '../../../packages/ui/src/**',
      files: '*.stories.*',
    },
  ],
  staticDirs: ['../public'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/preset-scss',
    'storybook-dark-mode',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: 'vite.config.ts',
      },
    },
  },
  docs: {
    autodocs: true,
    defaultName: 'Documentation',
  },

}
export default config
