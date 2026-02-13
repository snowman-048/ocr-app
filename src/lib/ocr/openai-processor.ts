import OpenAI from 'openai'

import { EConfidenceLevel, EOcrMethod } from './enums'
import { TOcrTemplate, TTemplateRecord, TTemplateType, getOcrTemplate } from './templates'
import { FREEFORM_TEMPLATE_TYPE } from './templates/freeform'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type TProps = {
  base64Image: string
  templateType?: TTemplateType
}

const CONFIDENCE_RULES = `CONFIDENCE RULES (per field):
- "${EConfidenceLevel.HIGH}": Text is clearly legible and unambiguous
- "${EConfidenceLevel.MEDIUM}": Text is readable but slightly unclear or ambiguous
- "${EConfidenceLevel.LOW}": Text is difficult to read, partially obscured, or uncertain`

const getFreeformPrompt = () => {
  return `You are an OCR system that extracts data from sheets.

Analyze this image and extract ALL data you can find into a JSON array of records.
Each record contains an array of field objects with key, value, and confidence.

Return JSON in this EXACT format:
{
  "records": [
    [
      {
        "key": "field1",
        "value": "detected_value",
        "confidence": "${EConfidenceLevel.HIGH}"
      },
      {
        "key": "field2",
        "value": 123,
        "confidence": "${EConfidenceLevel.MEDIUM}"
      }
      ... any other fields you detect
    ]
  ]
}

${CONFIDENCE_RULES}

EXTRACTION RULES:
- Each record (row) MUST contain data from a single row of the sheet
- Use descriptive field keys based on context (e.g., "date", "amount", "name")
- Each field MUST have key, value, and confidence
- Extract ALL rows and columns you can identify
- Preserve rows order in the records array
- Preserve columns order in the rows array
- Return ONLY valid JSON`
}

// - Rows and columns are split by black lines
// - Ignore any drawings and lines that are not part of the sheet

const getStructuredPrompt = (template: TOcrTemplate) => {
  const fieldDescriptions = template.fields
    ?.map((field, index) => {
      const formatInfo = field.format ? ` (format: ${field.format})` : ''
      return `${index + 1}. key: "${field.key}", type: ${field.type}, position: ${field.position}${formatInfo}`
    })
    .join('\n')

  const exampleRecord = template.fields?.map((field) => {
    let exampleValue
    if (field.type === 'number') exampleValue = 0
    else if (field.type === 'date')
      exampleValue = field.format === 'dd.mm.yyyy' ? '12.02.2026' : '2026-02-12'
    else exampleValue = 'example'

    return {
      key: field.key,
      value: exampleValue,
      confidence: EConfidenceLevel.HIGH,
    }
  })

  return `You are an OCR system extracting data from a "${template.name}" sheet which is ${template.description}.

This sheet has a PREDEFINED STRUCTURE with these fields IN ORDER:
${fieldDescriptions}

CRITICAL: Extract EVERY SINGLE ROW visible in the image. Do not skip any rows. Count the rows and ensure you extract all of them.

Extract ALL rows and map them to this EXACT schema:
{
  "records": [
    ${JSON.stringify(exampleRecord, null, 4)},
    ... (continue for ALL rows in the image)
  ]
}

CRITICAL RULES:
1. EXTRACTION RULES (HIGHEST PRIORITY):
  - YOU MUST EXTRACT EVERY VISIBLE ROW - DO NOT STOP HALFWAY
  - Each record (row) MUST contain data from a single row of the sheet
  - Count the total rows in the image and verify you extracted that many
  - Process the entire image from top to bottom
  - Do not truncate results - include all rows even if there are many
  ${template.ocrMethodMeta?.[EOcrMethod.OPENAI]?.extractionRules?.map((rule) => `- ${rule}`).join('\n') || ''}

2. STRUCTURE:
  - Each record is an array of objects with: key, value, confidence
  - Use EXACT field keys: ${template.fields?.map((f: any) => f.key).join(', ')}
  - Maintain field order as listed above

3. ${CONFIDENCE_RULES}

4. MAPPING STRATEGY:
  - Use column positions to identify fields
  - Column order: ${template.fields?.map((f: any) => f.label).join(' → ')}
  - If a cell is illegible, use null for value and "${EConfidenceLevel.LOW}" for confidence
  - If a cell is empty, use empty string for value and "${EConfidenceLevel.HIGH}" for confidence
  - Each record MUST have exactly ${template.fields?.length} fields (columns)

5. OUTPUT:
  - Return ONLY valid JSON
  - No additional text or explanations
  - Include ALL rows without truncation`
}

const processWithOpenAI = async ({
  base64Image,
  templateType,
}: TProps): Promise<TTemplateRecord[]> => {
  const template = getOcrTemplate(templateType)

  let prompt = ''
  if (template.type === FREEFORM_TEMPLATE_TYPE) {
    prompt = getFreeformPrompt()
  } else {
    prompt = getStructuredPrompt(template)
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5.2',
      // model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: 'low',
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      // temperature: 0.1,
    })

    const refusal = response.choices[0].message.refusal
    if (refusal) {
      throw new Error(refusal)
    }

    const content = response.choices[0].message.content
    if (!content) throw new Error('No response from OpenAI')

    const parsed = JSON.parse(content)

    return parsed.records || []
  } catch (error: any) {
    console.error('OpenAI processing error:', error)
    throw new Error(error?.message || 'OpenAI processing error')
  }
}

export { processWithOpenAI }
