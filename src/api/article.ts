import request from '../utils/request'

export interface ArticleItem {
  id: number
  title: string
  summary: string
  content: string
  cover: string
  categoryId: number
  viewCount: number
  isTop: boolean
  status: boolean
  createTime: string
  updateTime: string
  category: { id: number; name: string; slug: string; description: string; sort: number } | null
  tags: { id: number; name: string; color: string }[]
}

export interface PageResult<T> {
  total: number
  page: number
  size: number
  records: T[]
}

export interface ArticleQuery {
  page?: number
  size?: number
  keyword?: string
  categoryId?: number
  tagId?: number
}

export const getArticles = (params?: ArticleQuery) =>
  request.get<any, PageResult<ArticleItem>>('/articles', { params })

export const getArticleDetail = (id: number) =>
  request.get<any, ArticleItem>(`/articles/${id}`)

export const getAdminArticles = (params?: ArticleQuery & { status?: boolean }) =>
  request.get<any, PageResult<ArticleItem>>('/admin/articles', { params })

export const getAdminArticleDetail = (id: number) =>
  request.get<any, ArticleItem>(`/admin/articles/${id}`)

export const createArticle = (data: any) =>
  request.post<any, { id: number }>('/admin/articles', data)

export const updateArticle = (id: number, data: any) =>
  request.put(`/admin/articles/${id}`, data)

export const deleteArticle = (id: number) =>
  request.delete(`/admin/articles/${id}`)
