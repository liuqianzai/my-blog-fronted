import request from '../utils/request'

export interface UploadResult {
  url: string
  filename: string
}

export const uploadImage = (file: File): Promise<UploadResult> => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<any, UploadResult>('/files/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
