<template>
  <div class="space-y-6">
    <!-- 页面标题与顶部操作 -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">分类管理</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          管理文章分类与展示排序，支持下拉展开名下文章并支持自由拖拽修改归属分类。
        </p>
      </div>
      <div class="flex items-center gap-2.5">
        <button
          type="button"
          @click="toggleExpandAll"
          class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-3.5 py-1.5 rounded-xl text-xs font-medium transition shadow-xs"
        >
          {{ isAllExpanded ? '收起全部' : '展开全部' }}
        </button>
        <button
          type="button"
          @click="openMergeDialog"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-sm transition"
          title="将某个分类下的文章批量合并迁移到另一个分类"
        >
          合并分类
        </button>
        <div class="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
          共 <span class="font-bold text-primary">{{ list.length }}</span> 个分类
        </div>
      </div>
    </div>

    <!-- 添加分类卡片 -->
    <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm space-y-4">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-primary"></span>
        <h2 class="text-sm font-bold text-gray-800 dark:text-gray-200">新建分类</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <!-- 分类名称 (必填) -->
        <div class="md:col-span-3">
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            分类名称 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="newForm.name"
            placeholder="例如: 后端开发, 读书笔记"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            @keyup.enter="handleCreate"
            @blur="handleNameBlur"
          />
        </div>

        <!-- URL 别名 Slug -->
        <div class="md:col-span-3">
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">
              URL 别名 (Slug)
            </label>
            <button
              type="button"
              @click="generateNewSlug"
              class="text-[11px] text-primary hover:underline font-medium"
              title="根据分类名智能转换"
            >
              智能生成
            </button>
          </div>
          <input
            v-model="newForm.slug"
            placeholder="例如: backend, reading"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            @keyup.enter="handleCreate"
          />
        </div>

        <!-- 分类描述 -->
        <div class="md:col-span-3">
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            分类描述
          </label>
          <input
            v-model="newForm.description"
            placeholder="简短描述（选填）"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            @keyup.enter="handleCreate"
          />
        </div>

        <!-- 排序权重 -->
        <div class="md:col-span-1">
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            排序
          </label>
          <input
            v-model.number="newForm.sort"
            type="number"
            placeholder="0"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-2.5 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            @keyup.enter="handleCreate"
          />
        </div>

        <!-- 提交按钮 -->
        <div class="md:col-span-2">
          <button
            @click="handleCreate"
            :disabled="!newForm.name.trim() || isCreating"
            class="w-full bg-primary disabled:opacity-50 text-white py-2 rounded-xl text-sm font-medium hover:opacity-90 active:scale-95 transition shadow-sm flex items-center justify-center gap-1"
          >
            <el-icon v-if="isCreating" class="animate-spin"><RefreshRight /></el-icon>
            <span>添加分类</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 检索与分类列表卡片 -->
    <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm">
      <!-- 搜索筛选与操作提示栏 -->
      <div class="p-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-3 flex-wrap">
        <div class="relative flex-1 max-w-xs">
          <input
            v-model="searchKeyword"
            placeholder="搜索分类名称或别名..."
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          <button
            v-if="searchKeyword"
            @click="searchKeyword = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
          >
            ✕
          </button>
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
          <span class="inline-flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            按住文章卡片拖放至目标分类或行上方，即可快速切换分类
          </span>
        </div>
      </div>

      <!-- 分类数据表格 -->
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60 text-left text-gray-600 dark:text-gray-400">
            <th class="px-4 py-3.5 w-12 text-center">展开</th>
            <th class="px-4 py-3.5 font-medium w-20">排序</th>
            <th class="px-5 py-3.5 font-medium">分类名称</th>
            <th class="px-5 py-3.5 font-medium">URL 别名 (Slug)</th>
            <th class="px-5 py-3.5 font-medium w-28">文章数</th>
            <th class="px-5 py-3.5 font-medium">分类描述</th>
            <th class="px-5 py-3.5 font-medium text-right pr-6 w-36">操作</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="item in filteredList" :key="item.id">
            <!-- 分类信息主行 (作为直接释放目标落点) -->
            <tr
              class="border-b border-gray-100 dark:border-gray-800/70 transition-colors group select-none"
              :class="[
                dragOverCategoryId === item.id
                  ? 'bg-indigo-100/70 dark:bg-indigo-950/70 ring-2 ring-indigo-500 ring-inset'
                  : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/40',
                expandedCategoryIds.includes(item.id) ? 'bg-gray-50/40 dark:bg-gray-800/20' : ''
              ]"
              @dragover.prevent="handleDragOver($event, item.id)"
              @dragleave="handleDragLeave(item.id)"
              @drop.prevent="handleDropArticle(item.id)"
            >
              <!-- 展开/折叠箭头指示 -->
              <td class="px-4 py-3.5 text-center">
                <button
                  type="button"
                  @click="toggleExpandCategory(item.id)"
                  class="p-1 rounded-lg hover:bg-gray-200/70 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                  :title="expandedCategoryIds.includes(item.id) ? '收起名下文章' : '展开名下文章'"
                >
                  <el-icon
                    class="text-xs transition-transform duration-200"
                    :class="expandedCategoryIds.includes(item.id) ? 'rotate-90 text-primary font-bold' : ''"
                  >
                    <ArrowRight />
                  </el-icon>
                </button>
              </td>

              <!-- 排序 -->
              <td class="px-4 py-3.5 text-gray-500 dark:text-gray-400 font-mono text-xs">
                <span class="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {{ item.sort ?? 0 }}
                </span>
              </td>

              <!-- 名称 (支持点击展开) -->
              <td class="px-5 py-3.5 cursor-pointer" @click="toggleExpandCategory(item.id)">
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 text-xs font-semibold">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {{ item.name }}
                  </span>
                  <span
                    v-if="dragOverCategoryId === item.id"
                    class="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 animate-pulse"
                  >
                    松开鼠标移入此分类
                  </span>
                </div>
              </td>

              <!-- 别名 -->
              <td class="px-5 py-3.5">
                <span class="font-mono text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700/60">
                  /{{ item.slug || item.id }}
                </span>
              </td>

              <!-- 关联文章数与展开快捷入口 -->
              <td class="px-5 py-3.5">
                <button
                  type="button"
                  @click="toggleExpandCategory(item.id)"
                  class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full transition"
                  :class="(articleCountMap[item.id] || 0) > 0 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 hover:scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200/50 dark:border-gray-700/50'"
                  :title="expandedCategoryIds.includes(item.id) ? '点击收起文章' : '点击展开文章卡片'"
                >
                  <span>{{ articleCountMap[item.id] || 0 }} 篇</span>
                  <el-icon class="text-[10px] ml-0.5"><Document /></el-icon>
                </button>
              </td>

              <!-- 描述 -->
              <td class="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate" :title="item.description">
                {{ item.description || '-' }}
              </td>

              <!-- 操作按钮 -->
              <td class="px-5 py-3.5 text-right pr-6">
                <div class="inline-flex items-center gap-3">
                  <button
                    type="button"
                    @click="startEdit(item)"
                    class="text-primary hover:underline text-xs font-medium flex items-center gap-0.5"
                  >
                    <el-icon class="text-xs"><Edit /></el-icon>
                    <span>编辑</span>
                  </button>
                  <button
                    type="button"
                    @click="handleDelete(item.id)"
                    class="text-red-500 dark:text-red-400 hover:underline text-xs font-medium flex items-center gap-0.5"
                  >
                    <el-icon class="text-xs"><Delete /></el-icon>
                    <span>删除</span>
                  </button>
                </div>
              </td>
            </tr>

            <!-- 展开的文章卡片抽屉区 -->
            <tr
              v-if="expandedCategoryIds.includes(item.id)"
              :key="'expanded-' + item.id"
              class="border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/40"
              @dragover.prevent="handleDragOver($event, item.id)"
              @dragleave="handleDragLeave(item.id)"
              @drop.prevent="handleDropArticle(item.id)"
            >
              <td colspan="7" class="p-4 sm:p-5">
                <div
                  class="rounded-xl p-4 transition-all border border-dashed"
                  :class="dragOverCategoryId === item.id
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20'
                    : 'border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60'"
                >
                  <!-- 抽屉头部提示 -->
                  <div class="flex items-center justify-between mb-3 text-xs border-b border-gray-100 dark:border-gray-800 pb-2.5">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-gray-700 dark:text-gray-200">
                        「{{ item.name }}」名下文章 ({{ (articlesByCategory[item.id] || []).length }} 篇)
                      </span>
                      <span class="text-gray-400 text-[11px]">
                        可按住卡片拖拽至任意分类以更换归属
                      </span>
                    </div>
                    <router-link
                      :to="`/admin/articles?categoryId=${item.id}`"
                      class="text-primary hover:underline text-xs font-medium"
                    >
                      前往文章管理检索
                    </router-link>
                  </div>

                  <!-- 文章卡片网格 -->
                  <div
                    v-if="(articlesByCategory[item.id] || []).length > 0"
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    <div
                      v-for="art in articlesByCategory[item.id]"
                      :key="art.id"
                      draggable="true"
                      @dragstart="handleDragStart($event, art, item.id)"
                      @dragend="handleDragEnd"
                      class="bg-white dark:bg-gray-800/90 rounded-xl p-3.5 border border-gray-200/80 dark:border-gray-700/70 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 cursor-grab active:cursor-grabbing transition-all select-none group flex flex-col justify-between gap-2.5 relative"
                      :class="draggedArticle?.articleId === art.id ? 'opacity-40 scale-95 border-dashed border-indigo-500' : ''"
                    >
                      <!-- 标题与状态 -->
                      <div class="flex items-start justify-between gap-2">
                        <div class="flex items-center gap-1.5 flex-1 min-w-0">
                          <el-icon class="text-gray-400 group-hover:text-indigo-500 transition-colors shrink-0 text-sm">
                            <Rank />
                          </el-icon>
                          <router-link
                            :to="`/article/${art.id}`"
                            class="text-xs font-semibold text-gray-800 dark:text-gray-100 hover:text-primary truncate"
                            :title="art.title"
                            @click.stop
                          >
                            {{ art.title }}
                          </router-link>
                        </div>
                        <span
                          class="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
                          :class="art.status ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'"
                        >
                          {{ art.status ? '已发布' : '草稿' }}
                        </span>
                      </div>

                      <!-- 底部信息 -->
                      <div class="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-700/60">
                        <div class="flex items-center gap-2">
                          <span class="flex items-center gap-0.5">
                            <el-icon><View /></el-icon>
                            <span>{{ art.viewCount }}</span>
                          </span>
                          <span>{{ art.createTime ? art.createTime.split('T')[0] : '' }}</span>
                        </div>
                        <router-link
                          :to="`/admin/articles/${art.id}/edit`"
                          class="text-primary hover:underline text-[11px] font-medium"
                          @click.stop
                        >
                          编辑文章
                        </router-link>
                      </div>
                    </div>
                  </div>

                  <!-- 空文章提示 -->
                  <div
                    v-else
                    class="py-8 text-center text-xs text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center gap-1.5"
                  >
                    <el-icon class="text-2xl text-gray-300 dark:text-gray-600"><Document /></el-icon>
                    <span>该分类下当前暂无文章</span>
                    <span class="text-[11px] text-indigo-500/80">支持直接将上方或下方的文章卡片拖动至此区域以移入分类</span>
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <!-- 空分类列表提示 -->
          <tr v-if="filteredList.length === 0">
            <td colspan="7" class="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
              {{ searchKeyword ? '未找到匹配的分类' : '暂无分类，欢迎在上方添加首个分类' }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 底部专用落点：未分类文章收纳与拖拽专区 -->
      <div
        class="border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 p-4 transition-colors"
        :class="dragOverCategoryId === 'uncategorized' ? 'bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-500 ring-inset' : ''"
        @dragover.prevent="handleDragOver($event, null)"
        @dragleave="handleDragLeave(null)"
        @drop.prevent="handleDropArticle(null)"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="isUncategorizedExpanded = !isUncategorizedExpanded"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition"
            >
              <el-icon
                class="text-xs transition-transform duration-200"
                :class="isUncategorizedExpanded ? 'rotate-90 text-amber-600 font-bold' : ''"
              >
                <ArrowRight />
              </el-icon>
            </button>
            <span class="text-xs font-bold text-gray-700 dark:text-gray-300">
              未分类文章收纳区 ({{ uncategorizedArticles.length }} 篇)
            </span>
            <span
              v-if="dragOverCategoryId === 'uncategorized'"
              class="text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse ml-2"
            >
              松开鼠标将文章移为未分类
            </span>
          </div>
          <button
            type="button"
            @click="isUncategorizedExpanded = !isUncategorizedExpanded"
            class="text-xs text-primary hover:underline font-medium"
          >
            {{ isUncategorizedExpanded ? '收起' : '展开' }}
          </button>
        </div>

        <!-- 展开未分类文章卡片列表 -->
        <div v-if="isUncategorizedExpanded" class="pt-2">
          <div
            v-if="uncategorizedArticles.length > 0"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            <div
              v-for="art in uncategorizedArticles"
              :key="art.id"
              draggable="true"
              @dragstart="handleDragStart($event, art, null)"
              @dragend="handleDragEnd"
              class="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700 shadow-xs hover:shadow-md hover:border-amber-400 cursor-grab active:cursor-grabbing transition-all select-none group flex flex-col justify-between gap-2.5 relative"
              :class="draggedArticle?.articleId === art.id ? 'opacity-40 scale-95 border-dashed border-amber-500' : ''"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-1.5 flex-1 min-w-0">
                  <el-icon class="text-gray-400 group-hover:text-amber-500 transition-colors shrink-0 text-sm">
                    <Rank />
                  </el-icon>
                  <router-link
                    :to="`/article/${art.id}`"
                    class="text-xs font-semibold text-gray-800 dark:text-gray-100 hover:text-primary truncate"
                    :title="art.title"
                    @click.stop
                  >
                    {{ art.title }}
                  </router-link>
                </div>
                <span
                  class="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
                  :class="art.status ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'"
                >
                  {{ art.status ? '已发布' : '草稿' }}
                </span>
              </div>

              <div class="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-700/60">
                <span class="flex items-center gap-1">
                  <span>拖出即可归类</span>
                </span>
                <router-link
                  :to="`/admin/articles/${art.id}/edit`"
                  class="text-primary hover:underline text-[11px] font-medium"
                  @click.stop
                >
                  编辑文章
                </router-link>
              </div>
            </div>
          </div>

          <div v-else class="py-4 text-center text-xs text-gray-400">
            暂无未分类文章。如需将文章设为未分类，可将上方分类卡片拖至此处。
          </div>
        </div>
      </div>
    </div>

    <!-- 核心修改弹窗：现代化编辑分类对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="修改分类信息"
      width="520px"
      :close-on-click-modal="false"
      append-to-body
      @closed="handleEditDialogClosed"
    >
      <div class="space-y-4 py-1">
        <!-- 分类名称 (必填) -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            分类名称 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="editForm.name"
            placeholder="请输入分类名称"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        <!-- URL 别名 (Slug) -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              URL 别名 (Slug)
            </label>
            <button
              type="button"
              @click="generateEditSlug"
              class="text-xs text-primary hover:underline font-medium"
            >
              智能生成别名
            </button>
          </div>
          <input
            v-model="editForm.slug"
            placeholder="例如: backend, tech-notes"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            用于前台友好 URL 路由访问（如 /categories/tech-notes），建议使用英文字母、数字和连字符。
          </p>
        </div>

        <!-- 排序权重 -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            显示排序权重
          </label>
          <input
            v-model.number="editForm.sort"
            type="number"
            placeholder="0"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            数值越小越靠前（例如 0 为最高优先级或按序排列）。
          </p>
        </div>

        <!-- 分类描述 -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            分类描述
          </label>
          <textarea
            v-model="editForm.description"
            rows="3"
            placeholder="简短描述该分类下收录的主要内容..."
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-3.5 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          ></textarea>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2.5">
          <el-button @click="editDialogVisible = false" :disabled="isSaving">取消</el-button>
          <el-button type="primary" :loading="isSaving" @click="handleSave">保存修改</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 合并分类弹窗 -->
    <el-dialog
      v-model="mergeDialogVisible"
      title="合并分类"
      width="480px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="space-y-4 py-1">
        <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          将某个源分类名下的所有文章一次性批量转移至目标分类。适用于重构分类体系或合并细分主题。
        </p>

        <!-- 源分类 -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            源分类（将被合并的分类）<span class="text-red-500">*</span>
          </label>
          <select
            v-model="mergeSourceId"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          >
            <option :value="undefined" disabled>请选择源分类</option>
            <option
              v-for="cat in list"
              :key="cat.id"
              :value="cat.id"
              :disabled="cat.id === mergeTargetId"
            >
              {{ cat.name }} ({{ articleCountMap[cat.id] || 0 }} 篇)
            </option>
          </select>
        </div>

        <!-- 目标分类 -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            目标分类（文章迁入的目标）<span class="text-red-500">*</span>
          </label>
          <select
            v-model="mergeTargetId"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          >
            <option :value="undefined" disabled>请选择目标分类</option>
            <option
              v-for="cat in list"
              :key="cat.id"
              :value="cat.id"
              :disabled="cat.id === mergeSourceId"
            >
              {{ cat.name }} ({{ articleCountMap[cat.id] || 0 }} 篇)
            </option>
          </select>
        </div>

        <!-- 是否删除源分类 -->
        <div class="pt-1">
          <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="deleteSourceAfterMerge"
              class="rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500"
            />
            <span>合并完成后自动删除源分类</span>
          </label>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2.5">
          <el-button @click="mergeDialogVisible = false" :disabled="isMerging">取消</el-button>
          <el-button
            type="primary"
            :loading="isMerging"
            :disabled="!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId"
            @click="handleMergeSubmit"
          >
            {{ isMerging ? '正在合并迁移中...' : '确认合并' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory, Category } from '../../api/category'
import { getAdminArticles, getAdminArticleDetail, updateArticle, ArticleItem } from '../../api/article'
import { generateSlug } from '../../utils/slug'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, RefreshRight, ArrowRight, Document, Rank, View } from '@element-plus/icons-vue'

const list = ref<Category[]>([])
const articleCountMap = ref<Record<number, number>>({})
const articlesByCategory = ref<Record<number, ArticleItem[]>>({})
const uncategorizedArticles = ref<ArticleItem[]>([])
const expandedCategoryIds = ref<number[]>([])
const isUncategorizedExpanded = ref(false)
const searchKeyword = ref('')

const isCreating = ref(false)
const isSaving = ref(false)
const editDialogVisible = ref(false)
const editingId = ref<number | null>(null)

// 拖拽修改分类相关状态
interface DraggedArticleData {
  articleId: number
  articleTitle: string
  fromCategoryId: number | null
}
const draggedArticle = ref<DraggedArticleData | null>(null)
const dragOverCategoryId = ref<number | null | 'uncategorized'>(null)
const isUpdatingDrag = ref(false)

// 合并分类响应式状态
const mergeDialogVisible = ref(false)
const mergeSourceId = ref<number | undefined>(undefined)
const mergeTargetId = ref<number | undefined>(undefined)
const deleteSourceAfterMerge = ref(true)
const isMerging = ref(false)

const newForm = ref({
  name: '',
  slug: '',
  description: '',
  sort: 0
})

const editForm = ref({
  name: '',
  slug: '',
  description: '',
  sort: 0
})

const filteredList = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    (item) =>
      item.name.toLowerCase().includes(kw) ||
      (item.slug && item.slug.toLowerCase().includes(kw)) ||
      (item.description && item.description.toLowerCase().includes(kw))
  )
})

const isAllExpanded = computed(() => {
  return list.value.length > 0 && list.value.every((c) => expandedCategoryIds.value.includes(c.id))
})

onMounted(() => {
  fetchList()
})

async function fetchList() {
  try {
    list.value = await getCategories()
    fetchArticlesData()
  } catch {
    ElMessage.error('获取分类列表失败')
  }
}

async function fetchArticlesData() {
  try {
    const res = await getAdminArticles({ size: 1000 })
    const map: Record<number, ArticleItem[]> = {}
    const uncat: ArticleItem[] = []
    const countMap: Record<number, number> = {}

    list.value.forEach((cat) => {
      map[cat.id] = []
      countMap[cat.id] = 0
    })

    res.records.forEach((art) => {
      if (art.category?.id) {
        if (!map[art.category.id]) {
          map[art.category.id] = []
        }
        map[art.category.id].push(art)
        countMap[art.category.id] = (countMap[art.category.id] || 0) + 1
      } else {
        uncat.push(art)
      }
    })

    articlesByCategory.value = map
    uncategorizedArticles.value = uncat
    articleCountMap.value = countMap
  } catch {
    // ignore
  }
}

function toggleExpandCategory(id: number) {
  const idx = expandedCategoryIds.value.indexOf(id)
  if (idx >= 0) {
    expandedCategoryIds.value.splice(idx, 1)
  } else {
    expandedCategoryIds.value.push(id)
  }
}

function toggleExpandAll() {
  if (isAllExpanded.value) {
    expandedCategoryIds.value = []
  } else {
    expandedCategoryIds.value = list.value.map((c) => c.id)
  }
}

function handleDragStart(e: DragEvent, article: ArticleItem, fromCategoryId: number | null) {
  draggedArticle.value = {
    articleId: article.id,
    articleTitle: article.title,
    fromCategoryId
  }
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(article.id))
  }
}

function handleDragEnd() {
  draggedArticle.value = null
  dragOverCategoryId.value = null
}

function handleDragOver(e: DragEvent, targetCatId: number | null) {
  if (!draggedArticle.value) return
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  dragOverCategoryId.value = targetCatId === null ? 'uncategorized' : targetCatId
}

function handleDragLeave(targetCatId: number | null) {
  const currentCheck = targetCatId === null ? 'uncategorized' : targetCatId
  if (dragOverCategoryId.value === currentCheck) {
    dragOverCategoryId.value = null
  }
}

async function handleDropArticle(targetCategoryId: number | null) {
  if (!draggedArticle.value) return
  const { articleId, articleTitle, fromCategoryId } = draggedArticle.value
  dragOverCategoryId.value = null
  draggedArticle.value = null

  // 同分类内拖拽无需发起请求
  if (fromCategoryId === targetCategoryId) {
    return
  }

  const targetCat = targetCategoryId ? list.value.find((c) => c.id === targetCategoryId) : null
  const targetName = targetCat ? targetCat.name : '未分类'

  // 前端乐观更新 UI（即刻移动卡片位置并重算两端文章数）
  moveArticleLocal(articleId, fromCategoryId, targetCategoryId)

  isUpdatingDrag.value = true
  try {
    const detail = await getAdminArticleDetail(articleId)
    await updateArticle(articleId, {
      title: detail.title,
      summary: detail.summary || '',
      content: detail.content || '',
      cover: detail.cover || '',
      categoryId: targetCategoryId || undefined,
      tagIds: detail.tags?.map((t) => t.id) || [],
      isTop: detail.isTop,
      status: detail.status,
    })
    ElMessage.success(`已将文章「${articleTitle}」移动至「${targetName}」`)
  } catch (err: any) {
    ElMessage.error(err.message || '移动分类失败，已回滚')
    await fetchArticlesData()
  } finally {
    isUpdatingDrag.value = false
  }
}

function moveArticleLocal(articleId: number, fromCatId: number | null, toCatId: number | null) {
  let movedArticle: ArticleItem | undefined

  // 1. 从源数组取出
  if (fromCatId === null) {
    const idx = uncategorizedArticles.value.findIndex((a) => a.id === articleId)
    if (idx >= 0) {
      movedArticle = uncategorizedArticles.value.splice(idx, 1)[0]
    }
  } else if (articlesByCategory.value[fromCatId]) {
    const idx = articlesByCategory.value[fromCatId].findIndex((a) => a.id === articleId)
    if (idx >= 0) {
      movedArticle = articlesByCategory.value[fromCatId].splice(idx, 1)[0]
      articleCountMap.value[fromCatId] = Math.max(0, (articleCountMap.value[fromCatId] || 1) - 1)
    }
  }

  if (!movedArticle) return

  // 2. 插入到目标数组
  if (toCatId === null) {
    movedArticle.category = null
    movedArticle.categoryId = 0
    uncategorizedArticles.value.unshift(movedArticle)
    isUncategorizedExpanded.value = true
  } else {
    const targetCat = list.value.find((c) => c.id === toCatId)
    movedArticle.category = targetCat
      ? {
          id: targetCat.id,
          name: targetCat.name,
          slug: targetCat.slug,
          description: targetCat.description,
          sort: targetCat.sort
        }
      : null
    movedArticle.categoryId = toCatId
    if (!articlesByCategory.value[toCatId]) {
      articlesByCategory.value[toCatId] = []
    }
    articlesByCategory.value[toCatId].unshift(movedArticle)
    articleCountMap.value[toCatId] = (articleCountMap.value[toCatId] || 0) + 1

    // 自动展开目标分类以便用户即时看到新移入卡片
    if (!expandedCategoryIds.value.includes(toCatId)) {
      expandedCategoryIds.value.push(toCatId)
    }
  }
}

function handleNameBlur() {
  if (newForm.value.name.trim() && !newForm.value.slug.trim()) {
    newForm.value.slug = generateSlug(newForm.value.name)
  }
}

function generateNewSlug() {
  if (!newForm.value.name.trim()) {
    ElMessage.info('请先输入分类名称')
    return
  }
  newForm.value.slug = generateSlug(newForm.value.name)
}

function generateEditSlug() {
  if (!editForm.value.name.trim()) {
    ElMessage.info('请先输入分类名称')
    return
  }
  editForm.value.slug = generateSlug(editForm.value.name)
}

function startEdit(item: Category) {
  editingId.value = item.id
  editForm.value = {
    name: item.name,
    slug: item.slug || '',
    description: item.description || '',
    sort: item.sort ?? 0
  }
  editDialogVisible.value = true
}

function handleEditDialogClosed() {
  editingId.value = null
}

async function handleSave() {
  if (!editingId.value) return
  if (!editForm.value.name.trim()) {
    ElMessage.warning('分类名称不能为空')
    return
  }

  isSaving.value = true
  try {
    await updateCategory(editingId.value, {
      name: editForm.value.name.trim(),
      slug: editForm.value.slug.trim() || generateSlug(editForm.value.name),
      description: editForm.value.description.trim(),
      sort: editForm.value.sort ?? 0
    })
    ElMessage.success('分类修改成功')
    editDialogVisible.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '更新分类失败')
  } finally {
    isSaving.value = false
  }
}

async function handleCreate() {
  const name = newForm.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入分类名称')
    return
  }

  isCreating.value = true
  try {
    const slug = newForm.value.slug.trim() || generateSlug(name)
    await createCategory({
      name,
      slug,
      description: newForm.value.description.trim(),
      sort: newForm.value.sort ?? 0
    })
    ElMessage.success('创建分类成功')
    newForm.value = { name: '', slug: '', description: '', sort: 0 }
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '创建分类失败')
  } finally {
    isCreating.value = false
  }
}

function openMergeDialog() {
  mergeSourceId.value = undefined
  mergeTargetId.value = undefined
  deleteSourceAfterMerge.value = true
  mergeDialogVisible.value = true
}

async function handleMergeSubmit() {
  if (!mergeSourceId.value || !mergeTargetId.value || mergeSourceId.value === mergeTargetId.value) {
    ElMessage.warning('请正确选择源分类与目标分类')
    return
  }

  const sourceCat = list.value.find((c) => c.id === mergeSourceId.value)
  const targetCat = list.value.find((c) => c.id === mergeTargetId.value)
  const sourceName = sourceCat?.name || '源分类'
  const targetName = targetCat?.name || '目标分类'
  const count = articleCountMap.value[mergeSourceId.value] || 0

  try {
    await ElMessageBox.confirm(
      `确定要将「${sourceName}」名下的 ${count} 篇文章全部合并转移至「${targetName}」吗？${deleteSourceAfterMerge.value ? ' 合并后将自动删除「' + sourceName + '」。' : ''}`,
      '确认合并分类',
      {
        type: 'warning',
        confirmButtonText: '确定合并',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }

  isMerging.value = true
  try {
    const res = await getAdminArticles({ categoryId: mergeSourceId.value, size: 1000 })
    let transferCount = 0

    const promises = res.records.map(async (art) => {
      try {
        const detail = await getAdminArticleDetail(art.id)
        await updateArticle(art.id, {
          title: detail.title,
          summary: detail.summary || '',
          content: detail.content || '',
          cover: detail.cover || '',
          categoryId: mergeTargetId.value,
          tagIds: detail.tags?.map((t) => t.id) || [],
          isTop: detail.isTop,
          status: detail.status,
        })
        transferCount++
      } catch {
        // individual fail
      }
    })

    await Promise.all(promises)

    if (deleteSourceAfterMerge.value && mergeSourceId.value) {
      await deleteCategory(mergeSourceId.value)
    }

    ElMessage.success(`成功将 ${transferCount} 篇文章合并至「${targetName}」！`)
    mergeDialogVisible.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '合并分类失败')
  } finally {
    isMerging.value = false
  }
}

async function handleDelete(id: number) {
  const count = articleCountMap.value[id] || 0
  const confirmText = count > 0
    ? `警告：该分类下当前包含 ${count} 篇文章！删除后这些文章将失去分类（变为未分类）。若需保留文章归属，建议使用上方「合并分类」功能。确定要继续删除吗？`
    : '确定要删除该分类吗？'

  try {
    await ElMessageBox.confirm(
      confirmText,
      count > 0 ? '高风险操作：分类下存在文章' : '确认删除分类',
      {
        type: 'warning',
        confirmButtonText: count > 0 ? '仍然删除' : '删除',
        cancelButtonText: '取消',
        confirmButtonClass: count > 0 ? 'el-button--danger' : undefined
      }
    )
    await deleteCategory(id)
    ElMessage.success('分类已删除')
    await fetchList()
  } catch {
    // cancelled
  }
}
</script>
