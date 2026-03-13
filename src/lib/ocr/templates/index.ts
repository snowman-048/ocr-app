import z from 'zod'

import { EConfidenceLevel, EOcrMethod } from '../enums'
import { freeformTemplate } from './freeform'
import { patientLiquidBalanceTemplate } from './patient-liquid-balance'

type TTemplateRecord = {
  key: string
  value: any
  confidence: EConfidenceLevel
}[]

type TOcrTemplateExportVariant = {
  id: string
  name: string
  description: string
  formatData: (records: TTemplateRecord[]) => Record<string, any>[]
  isDefault?: boolean
  isBatchExport?: boolean
  columnsOrder?: string[]
  exportColumnsOrder?: string[]
  formatBatchData?: (allRecords: TTemplateRecord[][]) => any[]
  getHeader?: (value: string) => string
}

type TOcrTemplate = {
  type: string
  name: string
  description: string
  expectedRowCount?: number
  imageDetail?: 'low' | 'high' | 'auto'
  maxCompletionTokens?: number
  schema?: z.ZodSchema
  fields?: {
    key: string
    label: string
    type: 'number' | 'date' | 'text' | 'empty'
    position: string
    description: string
    required?: boolean
    format?: string
  }[]
  exportVariants: TOcrTemplateExportVariant[]
  ocrMethodMeta?: {
    [EOcrMethod.OPENAI]?: {
      extractionRules?: string[]
    }
  }
}

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

export type { TTemplateRecord, TTemplateType, TOcrTemplate, TOcrTemplateExportVariant }
