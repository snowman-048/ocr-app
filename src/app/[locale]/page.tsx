'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { TOcrResponse } from '@/api/ocr/types'
import { DataReviewStep } from '@/components/data-review-step'
import { ExportStep } from '@/components/export-step'
import { FileUploadStep, TFileUploadFormValues } from '@/components/file-upload-step'
import { FormatMethodStep } from '@/components/format-method-step'
import { StepProgress } from '@/components/step-progress'
import { useSessionStorage } from '@/hooks/use-session-storage'
import { TTemplateType, getOcrTemplate } from '@/lib/ocr/templates'

enum EStep {
  FILE_UPLOAD = 'file-upload',
  DYNAMIC_DATA_TABLE = 'dynamic-data-table',
  FORMAT_METHOD = 'format-method',
  EXPORT = 'export',
}

const STEP_QUERY_KEY = 'step'

const WIZARD_STEPS = [
  { id: EStep.FILE_UPLOAD, labelKey: 'steps.upload' },
  { id: EStep.DYNAMIC_DATA_TABLE, labelKey: 'steps.review' },
  { id: EStep.FORMAT_METHOD, labelKey: 'steps.format' },
  { id: EStep.EXPORT, labelKey: 'steps.export' },
]

const MainPage = () => {
  const [fileUploadValues, setFileUploadValues] = useState<TFileUploadFormValues | null>(null)
  const [currentOcrData, setCurrentOcrData, clearOcrData] = useSessionStorage<
    TOcrResponse[] | null
  >('ocr-results', null)
  const [formatMethodId, setFormatMethodId, clearFormatMethod] = useSessionStorage<string | null>(
    'format-method',
    null,
  )
  const [templateType, setTemplateType, clearTemplateType] = useSessionStorage<string | null>(
    'template-type',
    null,
  )

  // Internal state as source of truth
  const [step, setStepInternal] = useState<EStep>(EStep.FILE_UPLOAD)
  const isInitialized = useRef(false)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const template = useMemo(
    () =>
      getOcrTemplate(
        (fileUploadValues?.templateType ?? templateType ?? undefined) as TTemplateType | undefined,
      ),
    [fileUploadValues, templateType],
  )
  const isSingleExportFormat = useMemo(() => template.exportVariants.length === 1, [template])

  const hasData = !!currentOcrData?.length

  const setStep = useCallback(
    (newStep: EStep, replace = false) => {
      setStepInternal(newStep)
      ;(replace ? router.replace : router.push)(`${pathname}?step=${newStep}`)
    },
    [router, pathname],
  )

  // Initialize from URL on mount only
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const urlStep = searchParams.get(STEP_QUERY_KEY) as EStep | null
    if (urlStep && urlStep !== EStep.FILE_UPLOAD && hasData) {
      setStepInternal(urlStep)
    } else if (urlStep && urlStep !== EStep.FILE_UPLOAD && !hasData) {
      // Can't restore step without data, reset to upload
      router.replace(`${pathname}?step=${EStep.FILE_UPLOAD}`)
    }
  }, [])

  // Sync URL changes (back/forward) to internal state
  useEffect(() => {
    if (!isInitialized.current) return

    const urlStep = searchParams.get(STEP_QUERY_KEY) as EStep | null
    if (!urlStep) return

    // If navigating to a step that requires data but there's none, redirect
    if (urlStep !== EStep.FILE_UPLOAD && !hasData) {
      router.replace(`${pathname}?step=${EStep.FILE_UPLOAD}`)
      setStepInternal(EStep.FILE_UPLOAD)
      return
    }

    setStepInternal(urlStep)
  }, [searchParams])

  // Warn before leaving with unsaved data
  useEffect(() => {
    if (!hasData || step === EStep.FILE_UPLOAD) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasData, step])

  return (
    <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden p-4 gap-4">
      {step !== EStep.FILE_UPLOAD && (
        <div className="w-full max-w-2xl">
          <StepProgress steps={WIZARD_STEPS} currentStepId={step} />
        </div>
      )}
      {step === EStep.FILE_UPLOAD && (
        <FileUploadStep
          defaultValues={fileUploadValues}
          onUploadComplete={(data, values) => {
            setCurrentOcrData(data)
            setFileUploadValues(values)
            setTemplateType(values.templateType)
            setStep(EStep.DYNAMIC_DATA_TABLE)
          }}
        />
      )}
      {step === EStep.DYNAMIC_DATA_TABLE && hasData && (
        <DataReviewStep
          data={currentOcrData}
          template={template}
          files={fileUploadValues?.files}
          onGoBack={() => {
            setStep(EStep.FILE_UPLOAD, true)
            clearOcrData()
            clearTemplateType()
          }}
          onGoNext={(newData) => {
            const formatted = [...currentOcrData].map((item, index) => ({
              ...item,
              records: newData[index],
            }))
            setCurrentOcrData(formatted)
            if (isSingleExportFormat) {
              setFormatMethodId(template.exportVariants[0].id)
              setStep(EStep.EXPORT)
            } else {
              setStep(EStep.FORMAT_METHOD)
            }
          }}
        />
      )}
      {step === EStep.FORMAT_METHOD && (
        <FormatMethodStep
          template={template}
          defaultValue={formatMethodId}
          onGoBack={() => setStep(EStep.DYNAMIC_DATA_TABLE)}
          onGoNext={(id) => {
            setFormatMethodId(id)
            setStep(EStep.EXPORT)
          }}
        />
      )}
      {step === EStep.EXPORT && !!formatMethodId && hasData && (
        <ExportStep
          data={currentOcrData}
          template={template}
          formatMethodId={formatMethodId}
          onGoBack={() => {
            if (isSingleExportFormat) {
              setStep(EStep.DYNAMIC_DATA_TABLE, true)
            } else {
              setStep(EStep.FORMAT_METHOD, true)
            }
          }}
          onGoNext={() => {
            setFileUploadValues((prev) => (prev ? { ...prev, files: [] } : null))
            clearOcrData()
            clearFormatMethod()
            clearTemplateType()
            setStep(EStep.FILE_UPLOAD, true)
          }}
        />
      )}
    </div>
  )
}

export default MainPage
