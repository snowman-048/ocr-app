import { useMutation } from '@tanstack/react-query'

import { extractErrorDescription } from '@/helpers/extract-error-description'

import { uploadImageForOcr } from './api'

const useUploadImageForOcr = () => {
  return useMutation({
    mutationFn: uploadImageForOcr,

    onError: (error) => extractErrorDescription(error),
  })
}

export { useUploadImageForOcr }
