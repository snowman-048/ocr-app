import axios from 'axios'

import { TOcrResponse } from './types'

const BASE_URL = '/api/ocr'

const uploadImageForOcr = (formData: FormData) => axios.post<TOcrResponse>(BASE_URL, formData)

export { uploadImageForOcr }
