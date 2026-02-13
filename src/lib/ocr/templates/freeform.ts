import z from 'zod'

import { TOcrTemplate } from '.'
import { createOcrCellSchema, createOcrRecordSchema } from '../schemas'

const freeformRecordSchema = createOcrRecordSchema([
  createOcrCellSchema({ key: z.string(), value: z.unknown() }),
])

const FREEFORM_TEMPLATE_TYPE = 'freeform'

const freeformTemplate: TOcrTemplate = {
  type: FREEFORM_TEMPLATE_TYPE,
  name: 'Auto-Detect Fields',
  description: 'Automatically detect and extract all fields without predefined structure',
  schema: freeformRecordSchema,
  exportVariants: [
    {
      id: 'full',
      name: 'Complete Data',
      description: 'Export all detected fields',
      includeFields: ['all'],
    },
  ],
}

export { freeformTemplate, freeformRecordSchema, FREEFORM_TEMPLATE_TYPE }
