import { useEffect, useState } from 'react'

const useImageFilesPreviews = (files: File | File[]) => {
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    if (!files && !(files as File[])?.length) return
    ;(Array.isArray(files) ? files : [files]).forEach((file, index) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews((prev) => {
          const newPreview = [...prev]
          newPreview[index] = reader.result as string
          return newPreview
        })
      }
      reader.readAsDataURL(file)
    })
  }, [files])

  return { previews }
}

export { useImageFilesPreviews }
