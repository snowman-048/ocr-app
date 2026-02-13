import { toast } from 'sonner'

const extractErrorDescription = (error: any, showToast = true) => {
  let message = error?.message

  const responseError = (error?.response?.data?.message || error?.response?.data?.error) as
    | string[]
    | undefined

  if (responseError) {
    if (Array.isArray(responseError)) {
      message = ''
      responseError.forEach((item, index) => {
        message += `${item}`
        if (index < responseError.length - 1) {
          message += '; '
        }
      })
    } else {
      message = responseError
    }
  }

  if (showToast) {
    toast.error(message)
  }

  return message
}

export { extractErrorDescription }
