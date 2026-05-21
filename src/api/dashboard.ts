import request from '../utils/request'

export interface DashboardStats {
  totalArticles: number
  publishedArticles: number
  hiddenArticles: number
  totalTags: number
  totalCategories: number
  totalComments: number
  pendingComments: number
  totalViews: number
}

export const getDashboardStats = () =>
  request.get<any, DashboardStats>('/admin/dashboard/stats')
