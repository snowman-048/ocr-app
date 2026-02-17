'use client'

import { ReactNode, createContext, useCallback, useContext, useState } from 'react'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type TModalOptions = {
  title?: string | ReactNode
  description?: string
  footer?: ReactNode
  onBack?: () => void
}

type TModalContextValue = {
  openModal: (content: ReactNode, options?: TModalOptions) => void
  closeModal: () => void
  modalOptions: TModalOptions
  setModalOptions: (options: TModalOptions) => void
}

const ModalContext = createContext<TModalContextValue | null>(null)

const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState<ReactNode>(null)
  const [options, setOptions] = useState<TModalOptions>({})

  const openModal = useCallback((node: ReactNode, opts: TModalOptions = {}) => {
    setContent(node)
    setOptions(opts)
    setOpen(true)
  }, [])

  const closeModal = useCallback(() => setOpen(false), [])

  return (
    <ModalContext.Provider
      value={{ openModal, closeModal, modalOptions: options, setModalOptions: setOptions }}
    >
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-150 max-h-[calc(100%-2rem)] overflow-y-auto flex flex-col">
          <DialogHeader>
            {options.title && (
              <DialogTitle className="text-lg flex items-center gap-2">
                {!!options.onBack && (
                  <Button onClick={options.onBack} size="icon-sm" variant="ghost">
                    <ArrowLeft />
                  </Button>
                )}
                {options.title}
              </DialogTitle>
            )}
            {options.description && <DialogDescription>{options.description}</DialogDescription>}
          </DialogHeader>

          {content}

          {options.footer && <DialogFooter>{options.footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    </ModalContext.Provider>
  )
}

const useModal = () => {
  const ctx = useContext(ModalContext)
  if (!ctx) {
    throw new Error('useModal must be used within ModalProvider')
  }
  return ctx
}

export { ModalProvider, useModal }
