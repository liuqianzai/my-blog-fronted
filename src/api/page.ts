import request from '../utils/request'

export interface Page {
  id: number
  title: string
  slug: string
  content: string
  status: boolean
  createTime: string
  updateTime: string
}

export const getPageBySlug = (slug: string) =>
  request.get<any, Page>(`/pages/${slug}`)

export const getPublishedPages = () =>
  request.get<any, Pick<Page, 'id' | 'title' | 'slug'>[]>('/pages')

export const getAdminPages = () =>
  request.get<any, Page[]>('/admin/pages')

export const getAdminPageDetail = (id: number) =>
  request.get<any, Page>(`/admin/pages/${id}`)

export const createPage = (data: Partial<Page>) =>
  request.post('/admin/pages', data)

export const updatePage = (id: number, data: Partial<Page>) =>
  request.put(`/admin/pages/${id}`, data)

export const deletePage = (id: number) =>
  request.delete(`/admin/pages/${id}`)
