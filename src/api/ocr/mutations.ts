import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { extractErrorDescription } from '@/helpers/extract-error-description'

import { uploadImageForOcr } from './api'

const useUploadImageForOcr = () => {
  return useMutation({
    mutationFn: uploadImageForOcr,
    onSuccess: ({ data }) => {
      toast.success(
        `Visual detection was completed successfully in ${data.processingTime / 1000} seconds`,
      )
    },
    onError: (error) => extractErrorDescription(error),
  })
}

export { useUploadImageForOcr }
