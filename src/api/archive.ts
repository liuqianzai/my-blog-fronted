import request from '../utils/request'

export interface Archive {
  month: string
  count: number
}

export const getArchives = () =>
  request.get<any, Archive[]>('/archives')
