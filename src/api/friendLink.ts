import request from '../utils/request'

export interface FriendLink {
  id: number
  name: string
  url: string
  avatar: string
  description: string
  sort: number
  status: boolean
  createTime: string
}

export const getFriendLinks = () =>
  request.get<any, FriendLink[]>('/friend-links')

export const getAdminFriendLinks = () =>
  request.get<any, FriendLink[]>('/admin/friend-links')

export const getAdminFriendLinkDetail = (id: number) =>
  request.get<any, FriendLink>(`/admin/friend-links/${id}`)

export const createFriendLink = (data: Partial<FriendLink>) =>
  request.post('/admin/friend-links', data)

export const updateFriendLink = (id: number, data: Partial<FriendLink>) =>
  request.put(`/admin/friend-links/${id}`, data)

export const deleteFriendLink = (id: number) =>
  request.delete(`/admin/friend-links/${id}`)
