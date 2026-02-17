import { convertTemplateRecords } from './helpers'

const defaultExportVariant = {
  id: 'default',
  name: 'Default Format',
  description: 'All fields with original formatting',
  formatData: convertTemplateRecords,
}

export { defaultExportVariant }
