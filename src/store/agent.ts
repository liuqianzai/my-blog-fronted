import { defineStore } from 'pinia'
import {
  reportAgentBubble,
  type AgentEventDTO,
  type AgentPetBubbleVO,
  type ArticleSimpleVO,
} from '../api/agent'
import {
  getVisitorSessionId,
  isMutedToday,
  muteToday,
  unmute,
  recordRouteChangeAndCheckDebounced,
  isPassiveCooldownActive,
  markPassiveBubbleShown,
} from '../utils/agentSession'

export interface ChatMessageItem {
  id: string
  role: 'assistant' | 'user'
  content: string
  time: string
  relatedArticle?: ArticleSimpleVO | null
}

export interface ContextSnapshot {
  contextToken?: string
  divinationName?: string
  omen?: string
  articleTitle?: string
  articleId?: number
  summary?: string
}

export const useAgentStore = defineStore('agent', {
  state: () => ({
    // 小宠物神态: IDLE, HAPPY, THINKING, ENERGETIC, GUIDE
    petMood: 'IDLE' as 'IDLE' | 'HAPPY' | 'THINKING' | 'ENERGETIC' | 'GUIDE',
    // 当前展示的气泡响应体
    currentBubble: null as AgentPetBubbleVO | null,
    // 气泡卡片显隐
    bubbleVisible: false,
    // 对话抽屉显隐
    chatDrawerVisible: false,
    // 是否今日静音
    isMuted: isMutedToday(),
    // 对话继承上下文快照
    contextSnapshot: null as ContextSnapshot | null,
    // 对话消息列表
    chatMessages: [] as ChatMessageItem[],
    // 请求中状态
    loading: false,
    // 深度阅读已触发文章集合 (避免单页重复触发)
    readArticlesTriggered: new Set<number>(),
  }),

  actions: {
    /**
     * 检查并刷新静音状态
     */
    refreshMuteState() {
      this.isMuted = isMutedToday()
    },

    /**
     * 主动触发运势/卦象行为感知（最高优先级，无视被动冷却）
     */
    async triggerFortuneAction(divination: {
      name: string
      luckTitle: string
      classicQuote?: string
      nature?: string
      interpretation?: string
    }) {
      this.refreshMuteState()
      this.petMood = 'THINKING'

      const metaTags: string[] = []
      if (divination.luckTitle) metaTags.push(divination.luckTitle)
      if (divination.nature) metaTags.push(divination.nature)
      if (divination.classicQuote) metaTags.push(divination.classicQuote)

      const eventDTO: AgentEventDTO = {
        eventType: 'ACTION_CUSTOM',
        scene: 'FORTUNE_PAGE',
        metaTags,
        summary: `算得${divination.name}，${divination.luckTitle}`,
        visitorSessionId: getVisitorSessionId(),
        payload: {
          divinationName: divination.name,
          omen: divination.luckTitle,
        },
      }

      this.contextSnapshot = {
        divinationName: divination.name,
        omen: divination.luckTitle,
        summary: divination.interpretation || divination.luckTitle,
      }

      try {
        this.loading = true
        const res = await reportAgentBubble(eventDTO)
        if (res) {
          this.currentBubble = res
          this.petMood = (res.petMood as any) || 'HAPPY'
          this.bubbleVisible = true
          if (res.contextToken) {
            this.contextSnapshot.contextToken = res.contextToken
          }
          if (res.relatedArticle) {
            this.contextSnapshot.articleId = res.relatedArticle.id
            this.contextSnapshot.articleTitle = res.relatedArticle.title
          }
        }
      } catch (err) {
        // 接口异常静默降级，不阻断访客主流程
        console.warn('Agent fortune reaction failed:', err)
        this.petMood = 'IDLE'
      } finally {
        this.loading = false
      }
    },

    /**
     * 文章深度阅读感知上报 (滞留 > 30s 或滚动到底部)
     */
    async triggerArticleRead(article: { id: number; title: string }) {
      this.refreshMuteState()
      if (this.isMuted) return
      if (this.readArticlesTriggered.has(article.id)) return

      this.readArticlesTriggered.add(article.id)

      const eventDTO: AgentEventDTO = {
        eventType: 'ARTICLE_READ',
        scene: 'ARTICLE_DETAIL',
        targetId: article.id,
        summary: `正在深入研读《${article.title}》`,
        visitorSessionId: getVisitorSessionId(),
      }

      try {
        const res = await reportAgentBubble(eventDTO)
        if (res) {
          this.currentBubble = res
          this.petMood = (res.petMood as any) || 'GUIDE'
          this.bubbleVisible = true
          markPassiveBubbleShown()
          this.contextSnapshot = {
            contextToken: res.contextToken,
            articleId: article.id,
            articleTitle: article.title,
            summary: `研读文章《${article.title}》`,
          }
        }
      } catch (err) {
        console.warn('Agent article read reaction failed:', err)
      }
    },

    /**
     * 页面切换进入冷启动感知 (受 10s 切页防抖与 3 分钟被动冷却限制)
     */
    async triggerPageEnter(scene: string) {
      this.refreshMuteState()
      if (this.isMuted) return

      // 10秒内频繁切页防抖拦截
      const isDebounced = recordRouteChangeAndCheckDebounced()
      if (isDebounced) return

      // 前端 3 分钟被动防扰冷却检查
      if (isPassiveCooldownActive()) return

      const eventDTO: AgentEventDTO = {
        eventType: 'PAGE_ENTER',
        scene,
        visitorSessionId: getVisitorSessionId(),
      }

      try {
        const res = await reportAgentBubble(eventDTO)
        if (res) {
          this.currentBubble = res
          this.petMood = (res.petMood as any) || 'IDLE'
          this.bubbleVisible = true
          markPassiveBubbleShown()
          this.contextSnapshot = {
            contextToken: res.contextToken,
            summary: '浏览博客主页探索推荐',
          }
        }
      } catch (err) {
        console.warn('Agent page enter reaction failed:', err)
      }
    },

    /**
     * 收起气泡
     */
    dismissBubble() {
      this.bubbleVisible = false
      if (this.petMood !== 'IDLE') {
        setTimeout(() => {
          this.petMood = 'IDLE'
        }, 300)
      }
    },

    /**
     * 设置今日静音
     */
    setMuteToday() {
      muteToday()
      this.isMuted = true
      this.dismissBubble()
    },

    /**
     * 解除今日静音
     */
    unmutePet() {
      unmute()
      this.isMuted = false
      this.petMood = 'IDLE'
    },

    /**
     * 展开对话抽屉 (可携带上下文 Token)
     */
    openChat(contextToken?: string) {
      this.dismissBubble()
      this.chatDrawerVisible = true

      if (contextToken && this.contextSnapshot) {
        this.contextSnapshot.contextToken = contextToken
      }

      // 如果当前对话列表为空，自动基于上下文生成首条灵动开场白
      if (this.chatMessages.length === 0) {
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        let welcomeText = '你好！我是博主的智能助手。欢迎向我提问关于博文、技术栈或任何感兴趣的内容。'

        if (this.contextSnapshot?.divinationName) {
          welcomeText = `你好！刚才我们聊到你摇得的【${this.contextSnapshot.divinationName}】，心境正显【${this.contextSnapshot.omen || '玄妙'}】之象。想进一步探讨卦象寓意，还是看看顺应天时的技术好文？`
        } else if (this.contextSnapshot?.articleTitle) {
          welcomeText = `你好！看到你正在细心研读《${this.contextSnapshot.articleTitle}》，对本文的技术要点有疑问，或是想寻找相关知识点展开讨论吗？`
        }

        this.chatMessages.push({
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: welcomeText,
          time: nowTime,
          relatedArticle: this.currentBubble?.relatedArticle || null,
        })
      }
    },

    /**
     * 关闭对话抽屉
     */
    closeChat() {
      this.chatDrawerVisible = false
    },

    /**
     * 清空对话历史
     */
    clearChat() {
      this.chatMessages = []
      this.openChat()
    },

    /**
     * 发送访客对话消息
     */
    async sendUserMessage(text: string) {
      const trimmed = text.trim()
      if (!trimmed) return

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      // 添加用户消息
      this.chatMessages.push({
        id: `msg_user_${Date.now()}`,
        role: 'user',
        content: trimmed,
        time: nowTime,
      })

      // 模拟智能体思考状态与回应 (预留 Phase 3 SSE 流式接口)
      this.petMood = 'THINKING'
      this.loading = true

      try {
        await new Promise((resolve) => setTimeout(resolve, 600))

        let reply = `收到你的探讨：“${trimmed}”。博主的技术栈涵盖 Spring Boot、Vue 3、微服务高并发与周易数理，稍后阶段三将接入大模型为你流式深度解答！`

        if (this.contextSnapshot?.divinationName) {
          reply = `顺应你刚才摇得的【${this.contextSnapshot.divinationName}】气象，天地万物皆在运转变通之中。关于“${trimmed}”，博主建议以稳为主、兼蓄转机，阅读推荐专栏文章可为你带来更多灵感。`
        }

        this.chatMessages.push({
          id: `msg_assistant_${Date.now()}`,
          role: 'assistant',
          content: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
        this.petMood = 'HAPPY'
      } finally {
        this.loading = false
      }
    },
  },
})
