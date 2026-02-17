// lib/ocr/templates/patient-liquid-balance.ts
import { extractNumbersFromStringAndAdd } from '@/helpers/extract-numbers-from-string'
import { replaceValuesInObject } from '@/helpers/replace-values-in-object'

import { TOcrTemplate } from '.'
import { EOcrMethod } from '../enums'
import { defaultExportVariant } from './lib/export-variants'
import { convertTemplateRecords } from './lib/helpers'

const NUMBER_OF_ROWS = 24

type TDetectedDataOutput = {
  hour: string
  normal_intake: string
  injection_intake: string
  other_intake: string
  intake_ngs: string
  secretion: string
  special_weight: string
  secretion_ngs: string
}

type TParsedDataField =
  | 'shift'
  | 'timeWindow'
  | 'intakePerOs'
  | 'intakeIv'
  | 'intakeIm'
  | 'totalIntake'
  | 'secretionCathether'
  | 'secretionSpecialWeight'
  | 'stool'
  | 'totalSecretion'
  | 'netBalance'

const HEADER_MAP: Record<TParsedDataField, string> = {
  shift: 'Shift',
  timeWindow: 'Time Window',
  intakePerOs: 'Intake per os',
  intakeIv: 'Intake i.v.',
  intakeIm: 'Intake i.m.',
  totalIntake: 'Total Intake',
  secretionCathether: 'Cathether',
  secretionSpecialWeight: 'Special Weight',
  stool: 'Stool',
  totalSecretion: 'Total Secretion',
  netBalance: 'Net Balance',
}

const completeDatasetColumns = [
  'timeWindow',
  'intakePerOs',
  'intakeIv',
  'intakeIm',
  'totalIntake',
  'secretionCathether',
  'secretionSpecialWeight',
  'stool',
  'totalSecretion',
  'netBalance',
] as TParsedDataField[]

const calculateWindow = (rawData: TDetectedDataOutput[]) => {
  const calculated = rawData.reduce(
    (acc, record) => {
      acc.intakeIv +=
        extractNumbersFromStringAndAdd(record.normal_intake) +
        extractNumbersFromStringAndAdd(record.injection_intake) +
        extractNumbersFromStringAndAdd(record.other_intake)
      acc.secretionCathether += extractNumbersFromStringAndAdd(record.secretion_ngs)
      acc.secretionSpecialWeight +=
        extractNumbersFromStringAndAdd(record.secretion) +
        extractNumbersFromStringAndAdd(record.special_weight)
      return acc
    },
    {
      intakeIv: 0,
      secretionCathether: 0,
      secretionSpecialWeight: 0,
      // Mock data
      intakePerOs: 0,
      intakeIm: 0,
      stool: 0,
    },
  )

  const totalIntake = calculated.intakePerOs + calculated.intakeIv + calculated.intakeIm
  const totalSecretion =
    calculated.secretionCathether + calculated.secretionSpecialWeight + calculated.stool
  const netBalance = totalIntake - totalSecretion

  return {
    totalIntake,
    totalSecretion,
    netBalance,
    ...replaceValuesInObject({
      object: calculated,
      valueToReplace: 0,
      valueToReplaceWith: '',
    }),
  }
}

const processSingleDayData = (records: any[]) => {
  const converted = convertTemplateRecords<TDetectedDataOutput>(records)

  return [
    {
      hourFrom: 0,
      hourTo: 6,
    },
    {
      hourFrom: 6,
      hourTo: 12,
    },
    {
      hourFrom: 12,
      hourTo: 18,
    },
    {
      hourFrom: 18,
      hourTo: 24,
    },
  ].map((group) => {
    const rawData = converted.filter(
      (record) => +record.hour >= group.hourFrom && +record.hour < group.hourTo,
    )
    return {
      timeWindow: `${group.hourFrom}:00-${group.hourTo}:00`,
      ...calculateWindow(rawData),
    }
  })
}

const patientLiquidBalanceTemplate: TOcrTemplate = {
  type: 'patientLiquidBalance' as const,
  name: 'Patient Liquid Balance',
  description: `Structured log of a patient's liquid balance for a 24-hour shift`,
  expectedRowCount: NUMBER_OF_ROWS,
  ocrMethodMeta: {
    [EOcrMethod.OPENAI]: {
      extractionRules: [
        `This sheet has EXACTLY ${NUMBER_OF_ROWS} rows representing a 24-hour shift`,
        'Shift starts at hour 7 (7am) and ends at hour 6 (6am next day)',
        'Hours are in order: 7, 8, 9, ..., 23, 0, 1, 2, 3, 4, 5, 6',
        'Skip empty columns (columns 5-8)',
        'Ignore total/sum rows at the bottom',
        'If a value spans multiple columns, duplicate it for each relevant field',
        'Header row should NOT be included in extracted data',
      ],
    },
  },
  fields: [
    {
      key: 'hour',
      label: 'Hour',
      type: 'text',
      position: 'First column',
      description: 'Hour of day (7-23, then 0-6)',
    },
    {
      key: 'normal_intake',
      label: 'Normal Intake',
      type: 'text',
      position: 'Second column',
      description: 'Amount of liquid in ml taken per hour with mouth',
    },
    {
      key: 'injection_intake',
      label: 'Injection Intake',
      type: 'text',
      position: 'Third column',
      description: 'Amount of liquid in ml taken per hour by injecting it into a patient',
    },
    {
      key: 'other_intake',
      label: 'Other Intake',
      type: 'text',
      position: 'Fourth column',
      description: 'Amount of liquid in ml taken per hour by any other means',
    },
    {
      key: 'empty',
      label: 'none',
      type: 'empty',
      position: 'Fifth column',
      description: 'Omit',
    },
    {
      key: 'empty',
      label: 'none',
      type: 'empty',
      position: 'Sixth column',
      description: 'Omit',
    },
    {
      key: 'empty',
      label: 'none',
      type: 'empty',
      position: 'Seventh column',
      description: 'Omit',
    },
    {
      key: 'empty',
      label: 'none',
      type: 'empty',
      position: 'Eighth column',
      description: 'Omit',
    },
    {
      key: 'intake_ngs',
      label: 'Intake NGS',
      type: 'text',
      position: 'Nineth column',
      description: 'Amount of liquid in ml per hour that was taken in by any special means',
    },
    {
      key: 'secretion',
      label: 'Secretion',
      type: 'text',
      position: 'Tenth column',
      description: 'Amount of liquid in ml produced per hour by a patient',
    },
    {
      key: 'special_weight',
      label: 'Special Weight',
      type: 'text',
      position: 'Eleventh column',
      description: 'Amount of liquid in ml produced per hour that was contained',
    },
    {
      key: 'secretion_ngs',
      label: 'Secretion NGS',
      type: 'text',
      position: 'Twelfth column',
      description:
        'Amount of liquid in ml produced per hour that was taken out by any special means',
    },
  ],
  exportVariants: [
    defaultExportVariant,
    {
      id: 'complete',
      name: 'Complete dataset',
      description: 'Grouped by time windows for single 24-hour shift',
      getHeader: (value) => HEADER_MAP[value as TParsedDataField] ?? value,
      columnsOrder: completeDatasetColumns,
      formatData: (records) => processSingleDayData(records),
    },
    {
      id: 'complete-multi-day',
      name: 'Complete Multi-Shift Dataset',
      description: 'Grouped by time windows across multiple 24-hour shifts',
      isBatchExport: true,
      isDefault: true,
      getHeader: (value) => HEADER_MAP[value as TParsedDataField] ?? value,
      columnsOrder: ['shift', ...completeDatasetColumns],
      exportColumnsOrder: completeDatasetColumns,
      formatData: (records) => processSingleDayData(records),
      formatBatchData: (allRecords) => {
        const allConverted = allRecords.map((shiftRecords) =>
          convertTemplateRecords<TDetectedDataOutput>(shiftRecords),
        )

        const result: any[] = []

        const filterDataByTimeWindow = (data: TDetectedDataOutput[], from: number, to: number) =>
          data.filter((record) => {
            const hour = +record.hour
            return hour >= from && hour <= to
          })

        // Process each sheet and generate time windows
        allConverted.forEach((sheetData, sheetIndex) => {
          const currentDay = sheetIndex + 1
          const shift = currentDay

          // Shift N 0:00-6:00
          // Get hours 0-5 from PREVIOUS sheet (skip for first sheet)
          if (sheetIndex > 0) {
            const prevSheetData = allConverted[sheetIndex - 1]
            const rawData = filterDataByTimeWindow(prevSheetData, 0, 5)
            result.push({
              shift,
              timeWindow: `0:00-6:00`,
              ...calculateWindow(rawData),
            })
          }

          // Shift N 6:00-12:00
          // Hour 6 from previous sheet (if exists) + Hours 7-11 from current sheet
          if (sheetIndex === 0) {
            // First sheet: only hours 7-11
            const rawData = filterDataByTimeWindow(sheetData, 7, 11)
            result.push({
              shift,
              timeWindow: `6:00-12:00`,
              ...calculateWindow(rawData),
            })
          } else {
            // Subsequent sheets: hour 6 from previous + hours 7-11 from current
            const prevSheetData = allConverted[sheetIndex - 1]
            const hour6 = prevSheetData.filter((record) => +record.hour === 6)
            const hours7to11 = filterDataByTimeWindow(sheetData, 7, 11)
            result.push({
              shift,
              timeWindow: `6:00-12:00`,
              ...calculateWindow([...hour6, ...hours7to11]),
            })
          }

          // Shift N 12:00-18:00
          // Hours 12-17 from current sheet
          const hours12to17 = filterDataByTimeWindow(sheetData, 12, 17)
          result.push({
            shift,
            timeWindow: `12:00-18:00`,
            ...calculateWindow(hours12to17),
          })

          // Shift N 18:00-24:00
          // Hours 18-23 from current sheet
          const hours18to23 = filterDataByTimeWindow(sheetData, 18, 23)
          result.push({
            shift,
            timeWindow: `18:00-24:00`,
            ...calculateWindow(hours18to23),
          })
        })

        // Add final Shift N+1 0:00-6:00 from last sheet
        const lastSheetData = allConverted[allConverted.length - 1]
        const hours0to5 = filterDataByTimeWindow(lastSheetData, 0, 5)
        result.push({
          shift: allConverted.length + 1,
          timeWindow: `0:00-6:00`,
          ...calculateWindow(hours0to5),
        })

        return result
      },
    },
  ],
}

export { patientLiquidBalanceTemplate }
