import request from '../utils/request'

export interface UploadResult {
  url: string
  filename: string
}

export const uploadImage = (
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<any, UploadResult>('/files/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.min(100, Math.round((progressEvent.loaded * 100) / progressEvent.total))
        onProgress(percent)
      }
    },
  })
}

export const uploadGenericFile = (
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<any, UploadResult>('/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.min(100, Math.round((progressEvent.loaded * 100) / progressEvent.total))
        onProgress(percent)
      }
    },
  })
}

export const openLocalFolder = (path: string): Promise<any> => {
  return request.post('/admin/files/open-folder', { path })
}

export interface LocalImageImportVO {
  rawPath: string
  filename: string
  url: string | null
  success: boolean
  errorMessage: string | null
}

export interface LocalImageImportDTO {
  folderPath?: string
  imagePaths: string[]
}

/**
 * 直接从本地绝对路径/目录读取并一键转存图片
 */
export const importLocalImagesDirect = (data: LocalImageImportDTO): Promise<LocalImageImportVO[]> => {
  return request.post<any, LocalImageImportVO[]>('/admin/files/import-local-images', data)
}



