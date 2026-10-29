import request from '../utils/request'

/**
 * 智能体感知事件 DTO
 * 严格对齐后端 com.liuyang.myblog.domain.dto.AgentEventDTO
 */
export interface AgentEventDTO {
  eventType: 'ACTION_CUSTOM' | 'ARTICLE_READ' | 'PAGE_ENTER' | 'ADMIN_POST_SAVED' | string
  scene: string
  metaTags?: string[]
  summary?: string
  targetId?: number | null
  visitorSessionId: string
  payload?: Record<string, any>
}

/**
 * 操作建议 VO
 * 严格对齐后端 com.liuyang.myblog.domain.vo.AgentSuggestActionVO
 */
export interface AgentSuggestActionVO {
  actionCode: 'NAVIGATE_ARTICLE' | 'OPEN_CHAT' | 'DISMISS_BUBBLE' | 'MUTE_PET' | 'VIEW_PAGE' | string
  label: string
  payload?: Record<string, any>
}

/**
 * 精简文章 VO
 * 严格对齐后端 com.liuyang.myblog.domain.vo.ArticleSimpleVO
 */
export interface ArticleSimpleVO {
  id: number
  title: string
  summary: string
  cover?: string
  viewCount: number
  createTime?: string
  categoryName?: string
  tags?: string[]
  matchReason?: string
}

/**
 * 小宠物气泡输出 VO
 * 严格对齐后端 com.liuyang.myblog.domain.vo.AgentPetBubbleVO
 */
export interface AgentPetBubbleVO {
  bubbleText: string
  petMood: 'IDLE' | 'HAPPY' | 'THINKING' | 'ENERGETIC' | 'GUIDE' | string
  autoDismissSec: number
  suggestActions: AgentSuggestActionVO[]
  relatedArticle?: ArticleSimpleVO | null
  contextToken?: string
  cooldownSec: number
}

/**
 * 上报访客行为并获取小宠物气泡响应
 * 免密接口（支持游客与管理员识别）
 */
export const reportAgentBubble = (data: AgentEventDTO) =>
  request.post<any, AgentPetBubbleVO>('/agent/pet/bubble', data)

/**
 * 获取相关文章推荐 (Item-to-Item)
 */
export const getRelatedArticles = (articleId: number, limit = 5) =>
  request.get<any, ArticleSimpleVO[]>('/agent/recommend/related', {
    params: { articleId, limit },
  })

/**
 * 获取探索精选推荐 (冷启动与时间衰减)
 */
export const getExploreArticles = (limit = 5) =>
  request.get<any, ArticleSimpleVO[]>('/agent/recommend/explore', {
    params: { limit },
  })

/**
 * 根据业务语义标签获取推荐
 */
export const getArticlesByMetaTags = (tags: string[], limit = 5) =>
  request.get<any, ArticleSimpleVO[]>('/agent/recommend/tags', {
    params: { tags: tags.join(','), limit },
  })
