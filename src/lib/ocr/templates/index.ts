import z from 'zod'

import { EConfidenceLevel, EOcrMethod } from '../enums'
import { freeformTemplate } from './freeform'
import { patientLiquidBalanceTemplate } from './patient-liquid-balance'

type TOcrTemplate = {
  type: string
  name: string
  description: string
  schema?: z.ZodSchema
  fields?: {
    key: string
    label: string
    type: 'number' | 'date' | 'text'
    position: string
    description: string
    required?: boolean
    format?: string
  }[]
  exportVariants: {
    id: string
    name: string
    description: string
    includeFields: string[]
  }[]
  ocrMethodMeta?: {
    [EOcrMethod.OPENAI]?: {
      extractionRules?: string[]
    }
  }
}

type TTemplateRecord = {
  key: string
  value: any
  confidence: EConfidenceLevel
}[]

const TEMPLATES = {
  freeform: freeformTemplate,
  patientLiquidBalance: patientLiquidBalanceTemplate,
} as const

type TTemplateType = keyof typeof TEMPLATES

const getOcrTemplate = (type?: TTemplateType) => {
  return type ? TEMPLATES[type] : freeformTemplate
}

const getAllOcrTemplates = () => {
  return Object.values(TEMPLATES)
}

export { getOcrTemplate, getAllOcrTemplates }

export type { TTemplateRecord, TTemplateType, TOcrTemplate }
