import request from '../utils/request'

export interface Tag {
  id: number
  name: string
  color: string
}

export const getTags = () =>
  request.get<any, Tag[]>('/tags')

export const getTagDetail = (id: number) =>
  request.get<any, Tag>(`/tags/${id}`)

export const createTag = (data: Partial<Tag>) =>
  request.post<any, Tag>('/tags', data)

export const updateTag = (id: number, data: Partial<Tag>) =>
  request.put(`/tags/${id}`, data)

export const deleteTag = (id: number) =>
  request.delete(`/tags/${id}`)
