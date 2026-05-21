import request from '../utils/request'

export interface Comment {
  id: number
  articleId: number
  nickname: string
  email: string
  content: string
  approved: boolean
  createTime: string
}

export interface CommentQuery {
  articleId?: number
  page?: number
  size?: number
}

export const getComments = (params?: CommentQuery) =>
  request.get<any, { total: number; page: number; size: number; records: Comment[] }>('/comments', { params })

export const submitComment = (data: { articleId: number; nickname: string; email?: string; content: string }) =>
  request.post('/comments', data)

export const getAdminComments = (params?: CommentQuery & { approved?: boolean }) =>
  request.get<any, { total: number; page: number; size: number; records: Comment[] }>('/admin/comments', { params })

export const reviewComment = (id: number, approved: boolean) =>
  request.patch(`/admin/comments/${id}/review`, { approved })

export const deleteComment = (id: number) =>
  request.delete(`/admin/comments/${id}`)
