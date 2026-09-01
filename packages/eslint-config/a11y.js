import jsxA11y from 'eslint-plugin-jsx-a11y'

const CONTROL_COMPONENTS = ['Checkbox', 'Switch', 'Input', 'PasswordInput', 'Textarea', 'MultipleSelector', 'Select', 'RadioGroup', 'RadioGroupItem', 'Slider', 'TagInput', 'InputOTP']

/**
 * Shared jsx-a11y configuration.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const a11yConfig = [
  jsxA11y.flatConfigs.recommended,
  {
    rules: {
      'jsx-a11y/no-autofocus': 'off',
      'jsx-a11y/label-has-associated-control': ['error', { controlComponents: CONTROL_COMPONENTS, depth: 3 }],
      'jsx-a11y/no-noninteractive-tabindex': ['error', { tags: [], roles: ['tabpanel', 'region'], allowExpressionValues: true }],
    },
  },
]
