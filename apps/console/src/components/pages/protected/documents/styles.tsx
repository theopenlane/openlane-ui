import {
  StyleContext,
  vanillaRenderers
} from "@jsonforms/vanilla-renderers";

export const renderers = [
  ...vanillaRenderers,
  //register custom renderers
];

// TODO (hannah): update the styling to match the branding
export const styleContextValue: StyleContext = {
  styles: [
    {
      name: 'control',
      classNames: ['relative bg-white rounded-lg flex-col  mx-auto my-auto py-2 px-5 w-full max-w-8xl'],
    },
    {
      name: 'control.trim',
      classNames: ['trim'],
    },
    {
      name: 'control.input',
      classNames: ["w-full rounded border border-gray-300 mx-auto focus:border-java-500"],
    },
    {
      name: 'control.select',
      classNames: ['select'],
    },
    {
      name: 'control.checkbox',
      classNames: ['checkbox'],
    },
    {
      name: 'control.radio',
      classNames: ['radio'],
    },
    {
      name: 'control.radio.option',
      classNames: ['radio-option'],
    },
    {
      name: 'control.radio.input',
      classNames: ['radio-input'],
    },
    {
      name: 'control.radio.label',
      classNames: ['radio-label'],
    },
    {
      name: 'control.validation.error',
      classNames: ['p-4 ml-1'],
    },
    {
      name: 'control.validation',
      classNames: ['relative'],
    },
    {
      name: 'categorization',
      classNames: ['categorization'],
    },
    {
      name: 'categorization.master',
      classNames: ['categorization-master'],
    },
    {
      name: 'categorization.detail',
      classNames: ['categorization-detail'],
    },
    {
      name: 'category.group',
      classNames: ['text-2xl'],
    },
    {
      name: 'category.subcategories',
      classNames: ['category-subcategories'],
    },
    {
      name: 'array.layout',
      classNames: ['array-layout'],
    },
    {
      name: 'array.children',
      classNames: ['children'],
    },
    {
      name: "array.button",
      classNames: ["mr-auto mt-2 w-full"]
    },
    {
      name: 'group.layout',
      classNames: ['group-layout'],
    },
    {
      name: "group.label",
      classNames: ["text-2xl"],
    },
    {
      name: 'horizontal.layout',
      classNames: ['horizontal-layout'],
    },
    {
      name: 'horizontal.layout.item',
      classNames: ([size]: number[]) => [`horizontal-layout-${size}`],
    },
    {
      name: 'vertical.layout',
      classNames: ['vertical-layout'],
    },
    {
      name: 'array.table.validation.error',
      classNames: ['validation_error'],
    },
    {
      name: 'array.table.validation',
      classNames: ['validation'],
    },
    {
      name: 'array.table',
      classNames: ['table-auto', 'control'],
    },
    {
      name: 'array.control.validation.error',
      classNames: ['validation_error'],
    },
    {
      name: 'array.control.validation',
      classNames: ['validation'],
    },
    {
      name: 'array.control.add',
      classNames: ['flex flex-col gap-8'],
    },
    {
      name: 'array.child.controls',
      classNames: ['child-controls'],
    },
    {
      name: 'array.child.controls.up',
      classNames: ['flex flex-col gap-8'],
    },
    {
      name: 'array.child.controls.down',
      classNames: ['flex flex-col gap-8'],
    },
    {
      name: 'array.child.controls.delete',
      classNames: ['flex flex-col gap-8'],
    },
    {
      name: 'array.control',
      classNames: ['array-control-layout', 'control'],
    },
    {
      name: 'input.description',
      classNames: ['mx-auto'],
    },
  ]
};