import request from '../utils/request'

export interface Category {
  id: number
  name: string
  slug: string
  description: string
  sort: number
  createTime: string
  updateTime: string
}

export const getCategories = () =>
  request.get<any, Category[]>('/categories')

export const getCategoryDetail = (id: number) =>
  request.get<any, Category>(`/categories/${id}`)

export const createCategory = (data: Partial<Category>) =>
  request.post<any, Category>('/categories', data)

export const updateCategory = (id: number, data: Partial<Category>) =>
  request.put(`/categories/${id}`, data)

export const deleteCategory = (id: number) =>
  request.delete(`/categories/${id}`)
