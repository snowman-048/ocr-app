'use client'

import { useEffect, useState } from 'react'

import { Spinner } from './ui/spinner'

type TProps = {
  file: File
}

const ImageFilePreview = ({ file }: TProps) => {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [file])

  if (!preview) return <Spinner className="mx-auto" />

  return (
    <div className="w-full max-h-full overflow-hidden flex flex-col items-center gap-4">
      <img src={preview} alt={file.name || 'Preview'} className="max-h-full" />

      <p className="text-muted-foreground font-medium">{file.name}</p>
    </div>
  )
}

export { ImageFilePreview }
