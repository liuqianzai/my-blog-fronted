<template>
  <div>
    <!-- 遮罩层 -->
    <transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="agentStore.chatDrawerVisible"
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        @click="agentStore.closeChat()"
      ></div>
    </transition>

    <!-- 侧边对话抽屉 -->
    <transition
      enter-active-class="transition transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="agentStore.chatDrawerVisible"
        class="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] max-w-full bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col"
      >
        <!-- 抽屉头部 -->
        <div class="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50">
          <div class="flex items-center gap-3">
            <!-- 助手圆形徽标 -->
            <div class="w-9 h-9 rounded-full bg-blue-600/10 dark:bg-blue-400/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9" />
                <circle cx="9" cy="10" r="1" fill="currentColor" />
                <circle cx="15" cy="10" r="1" fill="currentColor" />
                <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
              </svg>
            </div>
            <div>
              <div class="text-sm font-bold text-gray-900 dark:text-gray-100">
                博客智能助手
              </div>
              <div class="text-[11px] text-gray-500 dark:text-gray-400">
                实时对话与智能推荐
              </div>
            </div>
          </div>

          <!-- 纯文本关闭按钮 -->
          <button
            type="button"
            class="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            @click="agentStore.closeChat()"
          >
            关闭
          </button>
        </div>

        <!-- 当前上下文继承提示条 -->
        <div
          v-if="agentStore.contextSnapshot?.divinationName || agentStore.contextSnapshot?.articleTitle"
          class="px-4 py-2 bg-blue-50/70 dark:bg-slate-800/60 border-b border-blue-100 dark:border-slate-800 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300"
        >
          <div class="flex items-center gap-1.5 truncate">
            <span class="font-medium">当前上下文:</span>
            <span v-if="agentStore.contextSnapshot.divinationName" class="truncate">
              卦象【{{ agentStore.contextSnapshot.divinationName }}】
            </span>
            <span v-else-if="agentStore.contextSnapshot.articleTitle" class="truncate">
              文章《{{ agentStore.contextSnapshot.articleTitle }}》
            </span>
          </div>
          <span class="text-[10px] text-blue-600 dark:text-blue-400 font-mono flex-shrink-0">已连接</span>
        </div>

        <!-- 消息展示区域 -->
        <div ref="messageContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
          <div
            v-for="msg in agentStore.chatMessages"
            :key="msg.id"
            class="flex flex-col"
            :class="msg.role === 'user' ? 'items-end' : 'items-start'"
          >
            <!-- 角色与时间戳 -->
            <div class="text-[10px] text-gray-400 dark:text-gray-500 mb-1 px-1">
              {{ msg.role === 'user' ? '访客' : '助手' }} · {{ msg.time }}
            </div>

            <!-- 消息气泡 -->
            <div
              class="max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed"
              :class="
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/50 dark:border-slate-700/50'
              "
            >
              {{ msg.content }}

              <!-- 消息附带的推荐文章卡片 (如有) -->
              <div
                v-if="msg.relatedArticle"
                class="mt-2.5 p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-700/80 text-gray-900 dark:text-gray-100 hover:border-blue-500 cursor-pointer transition-all"
                @click="handleNavigateArticle(msg.relatedArticle.id)"
              >
                <div class="font-semibold text-xs text-blue-600 dark:text-blue-400 line-clamp-1">
                  {{ msg.relatedArticle.title }}
                </div>
                <div class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                  {{ msg.relatedArticle.summary || msg.relatedArticle.matchReason }}
                </div>
                <div class="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                  <span>{{ msg.relatedArticle.categoryName || '博主好文' }}</span>
                  <span class="text-blue-600 dark:text-blue-400 font-medium">点击阅读</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 助手思考中打字指示条 -->
          <div v-if="agentStore.loading" class="flex items-center gap-2 text-xs text-gray-400">
            <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
            <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 0.4s"></div>
            <span>助手正在思考...</span>
          </div>
        </div>

        <!-- 快捷提问词条 (纯文本无符号) -->
        <div class="px-4 py-2 border-t border-gray-100 dark:border-slate-800/80 bg-gray-50/40 dark:bg-slate-900/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            v-if="agentStore.contextSnapshot?.divinationName"
            type="button"
            class="px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 whitespace-nowrap transition-colors"
            @click="sendQuickPrompt(`请帮我深度解读刚才算得的${agentStore.contextSnapshot.divinationName}卦象`)"
          >
            解读卦象寓意
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 whitespace-nowrap transition-colors"
            @click="sendQuickPrompt('博主的技术文章重点涵盖哪些方向？')"
          >
            了解技术专栏
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 whitespace-nowrap transition-colors"
            @click="sendQuickPrompt('请为我推荐一篇博主的置顶好文')"
          >
            推荐优质好文
          </button>
        </div>

        <!-- 底部输入框与操作栏 (纯文本无符号) -->
        <div class="p-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div class="flex items-center gap-2">
            <input
              v-model="inputText"
              type="text"
              placeholder="向智能助手提问..."
              class="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all text-gray-800 dark:text-gray-100"
              @keydown.enter.prevent="handleSend"
            />
            <button
              type="button"
              class="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
              @click="agentStore.clearChat()"
            >
              清空
            </button>
            <button
              type="button"
              :disabled="agentStore.loading || !inputText.trim()"
              class="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
              @click="handleSend"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAgentStore } from '../../store/agent'

const router = useRouter()
const agentStore = useAgentStore()

const inputText = ref('')
const messageContainer = ref<HTMLDivElement | null>(null)

// 自动滚动到最新消息
watch(
  () => agentStore.chatMessages.length,
  async () => {
    await nextTick()
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  },
)

function handleSend() {
  const text = inputText.value.trim()
  if (!text || agentStore.loading) return
  agentStore.sendUserMessage(text)
  inputText.value = ''
}

function sendQuickPrompt(promptText: string) {
  inputText.value = promptText
  handleSend()
}

function handleNavigateArticle(articleId: number) {
  agentStore.closeChat()
  router.push(`/article/${articleId}`)
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
