import { addons } from '@storybook/manager-api'
import '@repo/ui/styles.css'
import Openlane from './openlane'

addons.setConfig({
  theme: Openlane,
})
