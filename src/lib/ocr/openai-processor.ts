import OpenAI from 'openai'

import { EImageQuality } from '@/enums/image-quality'
import { logger } from '@/lib/logger'

import { EConfidenceLevel, EOcrMethod } from './enums'
import { TOcrTemplate, TTemplateRecord, TTemplateType, getOcrTemplate } from './templates'
import { FREEFORM_TEMPLATE_TYPE } from './templates/freeform'
import { TOcrAiConsumption } from './types'

type TProcessorProps = {
  base64Image: string
  templateType?: TTemplateType
  imageQuality?: EImageQuality
  client?: OpenAI
}

const createOpenAI = (apiKey?: string) => {
  return new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY })
}

let _openai: OpenAI | null = null
const getOpenAI = () => {
  if (!_openai) {
    _openai = createOpenAI()
  }
  return _openai
}

const CONFIDENCE_RULES = `CONFIDENCE RULES (per field):
- "${EConfidenceLevel.HIGH}": Text is clearly legible and unambiguous
- "${EConfidenceLevel.MEDIUM}": Text is readable but slightly unclear or ambiguous
- "${EConfidenceLevel.LOW}": Text is difficult to read, partially obscured, or uncertain`

const promptCache = new Map<string, string>()

const getTemplateCacheKey = (templateType: TTemplateType) => {
  return `ocr-template-${templateType}`
}

const getFreeformPrompt = () => {
  const cached = promptCache.get('freeform')
  if (cached) return cached

  const prompt = `You are an OCR system that extracts data from sheets.
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

  promptCache.set('freeform', prompt)
  return prompt
}

const getStructuredPrompt = (template: TOcrTemplate) => {
  const cacheKey = `structured-${template.type}`
  const cached = promptCache.get(cacheKey)
  if (cached) return cached

  const dataFields = template.fields?.filter((f) => f.type !== 'empty') || []
  const fieldDescriptions = dataFields
    .map((field, index) => {
      const formatInfo = field.format ? ` (format: ${field.format})` : ''
      const requiredInfo = field.required ? ' [REQUIRED]' : ' [OPTIONAL]'
      return `${index + 1}. "${field.key}" (${field.type})${requiredInfo} - ${field.position}: ${field.description}${formatInfo}`
    })
    .join('\n')
  const exampleRecord = dataFields.map((field) => {
    let exampleValue
    if (field.type === 'number') exampleValue = 0
    else if (field.type === 'date')
      exampleValue = field.format === 'dd.mm.yyyy' ? '12.02.2026' : '2026-02-12'
    else exampleValue = '1'
    return {
      key: field.key,
      value: exampleValue,
      confidence: EConfidenceLevel.HIGH,
    }
  })
  const rowCountConstraint = template.expectedRowCount
    ? `
CRITICAL ROW COUNT CONSTRAINT:
- This sheet contains EXACTLY ${template.expectedRowCount} data rows
- You MUST extract exactly ${template.expectedRowCount} records
- Count the rows carefully before extraction
- Verify your output has exactly ${template.expectedRowCount} records before responding
`
    : ''
  const extraRules = template.ocrMethodMeta?.[EOcrMethod.OPENAI]?.extractionRules || []
  const prompt = `You are an OCR system extracting data from a "${template.name}" sheet.
${template.description}
${rowCountConstraint}
FIELD STRUCTURE (${dataFields.length} fields per row):
${fieldDescriptions}
${extraRules.length > 0 ? `TEMPLATE-SPECIFIC RULES:\n${extraRules.map((rule) => `- ${rule}`).join('\n')}\n` : ''}
EXAMPLE OUTPUT FORMAT (showing the first row):
{
  "records": [
    ${JSON.stringify(exampleRecord)}
    ${template.expectedRowCount ? `... (continue for all ${template.expectedRowCount} rows)` : '... (continue for ALL visible rows)'}
  ]
}
EXTRACTION REQUIREMENTS:
1. ROW EXTRACTION:
  ${template.expectedRowCount ? `- Extract EXACTLY ${template.expectedRowCount} rows (no more, no less)` : '- Extract EVERY visible data row'}
  - Process the entire table from top to bottom
  - Skip header rows (column labels)
  - Each record = one data row only
  ${template.expectedRowCount ? `- VERIFY: Final output must have ${template.expectedRowCount} records` : ''}
2. FIELD EXTRACTION:
  - Extract only these fields: ${dataFields.map((f) => f.key).join(', ')}
  - Maintain exact field order as listed
  - Each record must have exactly ${dataFields.length} field objects
3. VALUE HANDLING:
  - Empty cells → empty string "" with confidence "${EConfidenceLevel.HIGH}"
  - Illegible cells → null with confidence "${EConfidenceLevel.LOW}"
  - Numeric values → keep as numbers or strings based on field type
4. ${CONFIDENCE_RULES}
5. QUALITY CHECKS:
  ${template.expectedRowCount ? `- Count rows: Output MUST contain ${template.expectedRowCount} records` : '- Count rows: Extract ALL visible data rows'}
  - Count fields: Each record MUST contain ${dataFields.length} fields
  - Check order: Fields must match the sequence above
  - Verify structure: Nested array format [[field objects], [field objects], ...]
OUTPUT REQUIREMENTS:
- Return ONLY valid JSON (no explanations)
- Use exact key names (case-sensitive)
- Preserve data types (numbers as numbers, text as strings)
${template.expectedRowCount ? `- Final JSON must have exactly ${template.expectedRowCount} records in the array` : ''}
- Do not truncate or summarize - extract complete data`

  promptCache.set(cacheKey, prompt)
  return prompt
}

const extractTokenConsumption = (
  usage: OpenAI.Completions.CompletionUsage | undefined,
): TOcrAiConsumption => {
  if (!usage) {
    return { input: 0, output: 0, total: 0, cached: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = usage as any
  const cachedTokens =
    u.cached_tokens || u.prompt_tokens_details?.cached_tokens || u.prompt_cache_hit_tokens || 0

  return {
    total: usage.total_tokens,
    input: usage.prompt_tokens,
    output: usage.completion_tokens,
    cached: cachedTokens as number,
  }
}

const resolveImageDetail = (
  template: TOcrTemplate,
  imageQuality?: EImageQuality,
): 'low' | 'high' | 'auto' => {
  // If template explicitly sets a detail level, respect it
  if (template.imageDetail) return template.imageDetail

  // For good quality images with no explicit template setting, use low detail
  if (imageQuality === EImageQuality.GOOD) return 'low'

  // Default to high for poor quality or unknown
  return 'high'
}

const RETRYABLE_STATUS_CODES = [429, 500, 502, 503]
const MAX_RETRIES = 2
const BASE_RETRY_DELAY_MS = 1000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const processWithOpenAI = async ({
  base64Image,
  templateType,
  imageQuality,
  client,
}: TProcessorProps) => {
  const template = getOcrTemplate(templateType)
  const prompt =
    template.type === FREEFORM_TEMPLATE_TYPE ? getFreeformPrompt() : getStructuredPrompt(template)

  const imageDetail = resolveImageDetail(template, imageQuality)
  const maxCompletionTokens = template.maxCompletionTokens ?? 5000

  const openai = client ?? getOpenAI()

  let lastError: unknown = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        logger.info({ msg: 'Retrying OpenAI request', attempt, delayMs: delay })
        await sleep(delay)
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract data from this ${template.name} sheet`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: imageDetail,
                },
              },
            ],
          },
        ],
        temperature: 0,
        max_completion_tokens: maxCompletionTokens,
        response_format: { type: 'json_object' },
        prompt_cache_key: getTemplateCacheKey(template.type as TTemplateType),
      })

      const tokensConsumption = extractTokenConsumption(response.usage)

      // Log prompt cache effectiveness
      if (tokensConsumption.cached > 0) {
        logger.info({
          msg: 'Prompt cache hit',
          cachedTokens: tokensConsumption.cached,
          totalInput: tokensConsumption.input,
          cacheRatio: `${Math.round((tokensConsumption.cached / tokensConsumption.input) * 100)}%`,
        })
      }

      logger.info({
        msg: 'OpenAI request completed',
        imageDetail,
        maxCompletionTokens,
        tokens: tokensConsumption,
        attempt,
      })

      const refusal = response.choices[0].message.refusal
      if (refusal) {
        throw new Error(`OpenAI refused to process: ${refusal}`)
      }

      const content = response.choices[0].message.content
      if (!content) throw new Error('No response content from OpenAI')

      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(content)
      } catch {
        throw new Error('Failed to parse OpenAI response as JSON')
      }

      const records = (parsed.records || []) as TTemplateRecord[]

      return {
        records,
        tokensConsumption,
      }
    } catch (error: unknown) {
      lastError = error

      // Check if error is retryable
      const isRetryable =
        error instanceof OpenAI.APIError && RETRYABLE_STATUS_CODES.includes(error.status)

      if (isRetryable && attempt < MAX_RETRIES) {
        logger.warn({
          msg: 'Retryable OpenAI error',
          status: (error as InstanceType<typeof OpenAI.APIError>).status,
          attempt,
        })
        continue
      }

      // Non-retryable or exhausted retries
      break
    }
  }

  logger.error({ msg: 'OpenAI processing error', error: lastError })
  const message = lastError instanceof Error ? lastError.message : 'OpenAI processing error'
  throw new Error(message)
}

export { processWithOpenAI, createOpenAI }
