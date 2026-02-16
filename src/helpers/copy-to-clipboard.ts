const copyToClipboard = async (text: string) => {
  return navigator.clipboard.writeText(text)
}

export { copyToClipboard }
