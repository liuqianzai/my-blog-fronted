<template>
  <div
    class="relative"
    @dragenter.prevent="handlePageDragEnter"
    @dragover.prevent="handlePageDragOver"
    @dragleave.prevent="handlePageDragLeave"
    @drop.prevent="handlePageDrop"
  >
    <!-- 全局拖入 Markdown 提示蒙层 -->
    <div
      v-if="isPageDragOver"
      class="fixed inset-0 z-50 bg-indigo-600/15 dark:bg-indigo-500/25 backdrop-blur-[3px] border-4 border-dashed border-indigo-600 flex flex-col items-center justify-center pointer-events-none transition-all"
    >
      <div class="bg-white/95 dark:bg-gray-800/95 px-8 py-6 rounded-2xl shadow-2xl border border-indigo-600/30 flex items-center gap-4 text-center">
        <el-icon class="text-4xl text-indigo-600 animate-bounce"><UploadFilled /></el-icon>
        <div>
          <div class="text-base font-bold text-gray-800 dark:text-gray-100">松开鼠标即可批量加入导入队列</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">自动识别所有 Markdown (.md) 文件并唤起批量入库面板</div>
        </div>
      </div>
    </div>

    <!-- 顶部操作栏 -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">文章管理</h1>
      <div class="flex gap-2">
        <button
          type="button"
          @click="openBatchImportModal"
          class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm font-medium"
        >
          <el-icon><UploadFilled /></el-icon>
          <span>批量导入</span>
        </button>
        <router-link
          to="/admin/articles/create?import=md"
          class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1.5 shadow-sm font-medium"
        >
          <el-icon><Document /></el-icon>
          <span>单篇导入</span>
        </router-link>
        <router-link
          to="/admin/articles/create"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition shadow-sm font-medium"
        >
          新建文章
        </router-link>
      </div>
    </div>

    <!-- 筛选搜索栏 -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4 flex flex-wrap gap-3">
      <input
        v-model="keyword"
        placeholder="搜索文章标题..."
        class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary/40"
        @input="onSearch"
      />
      <select
        v-model="categoryFilter"
        class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        @change="onCategoryFilterChange"
      >
        <option value="">全部分类</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <select
        v-model="statusFilter"
        class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        @change="fetchData"
      >
        <option value="">全部状态</option>
        <option value="true">已发布</option>
        <option value="false">草稿</option>
      </select>
    </div>

    <!-- 批量操作通知栏 -->
    <div
      v-if="selectedArticleIds.length > 0"
      class="bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between text-xs transition"
    >
      <div class="flex items-center gap-2">
        <span class="font-bold text-indigo-700 dark:text-indigo-300">
          已勾选 {{ selectedArticleIds.length }} 篇文章
        </span>
        <button
          type="button"
          @click="selectedArticleIds = []"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
        >
          取消选择
        </button>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="openBatchTagDialog"
          class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition shadow-sm flex items-center gap-1.5"
        >
          <span>批量设置标签</span>
        </button>
        <button
          type="button"
          @click="openBatchCategoryDialog"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition shadow-sm flex items-center gap-1.5"
        >
          <span>批量修改分类</span>
        </button>
      </div>
    </div>

    <!-- 文章表格 -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 text-left text-gray-600 dark:text-gray-400">
            <th class="px-3 py-3 w-10 text-center">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
                class="rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </th>
            <th class="px-4 py-3 font-medium">标题</th>
            <th class="px-4 py-3 font-medium">分类</th>
            <th class="px-4 py-3 font-medium">标签</th>
            <th class="px-4 py-3 font-medium w-20">阅读</th>
            <th class="px-4 py-3 font-medium w-24">状态</th>
            <th class="px-4 py-3 font-medium w-40">创建时间</th>
            <th class="px-4 py-3 font-medium w-44">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.records" :key="row.id" class="border-b border-gray-100 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
            <td class="px-3 py-3 text-center">
              <input
                type="checkbox"
                :value="row.id"
                v-model="selectedArticleIds"
                class="rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </td>
            <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 max-w-xs truncate">
              <router-link :to="`/article/${row.id}`" class="hover:text-primary transition" title="查看文章">
                {{ row.title }}
              </router-link>
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
              <el-dropdown trigger="click" @command="(catId: number | null) => handleQuickChangeCategory(row, catId)">
                <span
                  class="inline-flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs group"
                  title="点击快捷修改文章分类"
                >
                  <span class="font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary">
                    {{ row.category?.name || '未分类' }}
                  </span>
                  <el-icon class="text-[10px] text-gray-400 group-hover:text-primary"><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <div class="px-3 py-1 text-[11px] font-semibold text-gray-400 border-b border-gray-100 dark:border-gray-700 mb-1">
                      快捷修改所属分类
                    </div>
                    <el-dropdown-item :command="null" :disabled="!row.category">
                      <span :class="{ 'text-primary font-bold': !row.category }">未分类</span>
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-for="cat in categories"
                      :key="cat.id"
                      :command="cat.id"
                      :disabled="row.category?.id === cat.id"
                    >
                      <span :class="{ 'text-primary font-bold': row.category?.id === cat.id }">{{ cat.name }}</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </td>
            <td class="px-4 py-3">
              <el-popover
                :ref="getPopoverRefSetter(row.id)"
                v-model:visible="popoverVisibleMap[row.id]"
                trigger="click"
                :width="300"
                placement="bottom-start"
                @show="initEditTagsForArticle(row)"
              >
                <template #reference>
                  <div
                    class="cursor-pointer group flex flex-wrap items-center gap-1 p-1 -m-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/60 transition"
                    title="点击快捷设置标签"
                    @click="openEditTagsPopover(row)"
                  >
                    <span
                      v-for="t in row.tags"
                      :key="t.id"
                      class="inline-block rounded px-2 py-0.5 text-xs font-medium border transition"
                      :style="{
                        color: t.color || 'var(--text-sub, #6b7280)',
                        backgroundColor: (t.color || '#6b7280') + '15',
                        borderColor: (t.color || '#6b7280') + '40'
                      }"
                    >
                      {{ t.name }}
                    </span>
                    <span v-if="!row.tags?.length" class="text-xs text-gray-400 group-hover:text-primary">
                      无标签
                    </span>
                    <span class="text-[10px] text-gray-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition px-0.5 font-medium">
                      修改
                    </span>
                  </div>
                </template>

                <div class="space-y-3 py-1">
                  <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                    <span class="font-bold text-xs text-gray-800 dark:text-gray-200 truncate max-w-[170px]" :title="row.title">
                      {{ row.title || '设置标签' }}
                    </span>
                    <div class="flex items-center gap-2">
                      <span class="text-[11px] text-gray-400">已选 {{ activeSelectedTagIds.length }} 个</span>
                      <button
                        v-if="activeSelectedTagIds.length > 0"
                        type="button"
                        @click.stop="activeSelectedTagIds = []"
                        class="text-[11px] text-gray-400 hover:text-red-500 underline cursor-pointer"
                        title="清空当前已勾选的标签"
                      >
                        清空已选
                      </button>
                    </div>
                  </div>

                  <!-- 标签过滤输入 -->
                  <input
                    v-model="popoverTagKeyword"
                    placeholder="过滤可用标签..."
                    class="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                    @click.stop
                  />

                  <!-- 标签选择云 -->
                  <div class="max-h-40 overflow-y-auto flex flex-wrap gap-1.5 p-1">
                    <button
                      v-for="tag in filteredSystemTags"
                      :key="tag.id"
                      type="button"
                      @click.stop="toggleActiveTag(tag.id)"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border transition-all active:scale-95 select-none"
                      :style="isTagActive(tag.id)
                        ? {
                            color: tag.color || '#315fbd',
                            backgroundColor: (tag.color || '#315fbd') + '22',
                            borderColor: tag.color || '#315fbd',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                          }
                        : {
                            color: 'var(--text-sub, #6b7280)',
                            backgroundColor: 'transparent',
                            borderColor: 'rgba(156, 163, 175, 0.3)'
                          }"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: tag.color || '#315fbd' }"></span>
                      <span>{{ tag.name }}</span>
                      <el-icon v-if="isTagActive(tag.id)" class="text-[10px] ml-0.5"><Check /></el-icon>
                    </button>
                    <span v-if="filteredSystemTags.length === 0" class="text-xs text-gray-400 py-2">
                      未找到匹配标签
                    </span>
                  </div>

                  <!-- 快捷新建与底部操作 -->
                  <div class="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1 flex-1">
                      <input
                        v-model="newTagNameInPopover"
                        placeholder="新建标签"
                        class="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded px-2 py-0.5 text-xs w-20 focus:outline-none focus:ring-1 focus:ring-primary/40"
                        @keyup.enter="handleCreateTagInPopover"
                        @click.stop
                      />
                      <button
                        type="button"
                        :disabled="!newTagNameInPopover.trim()"
                        @click.stop="handleCreateTagInPopover"
                        class="text-xs text-primary disabled:opacity-40 hover:underline px-1 font-medium"
                      >
                        新建
                      </button>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <el-button size="small" @click.stop="closeActiveTagPopover(row)">取消</el-button>
                      <el-button type="primary" size="small" :loading="isSavingRowTags" @click.stop="handleSaveRowTags(row)">保存</el-button>
                    </div>
                  </div>
                </div>
              </el-popover>
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ row.viewCount }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs font-medium" :class="row.status ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700/50'">
                {{ row.status ? '已发布' : '草稿' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ row.createTime }}</td>
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex gap-2 whitespace-nowrap items-center">
                <router-link :to="`/article/${row.id}`" class="text-emerald-600 dark:text-emerald-400 hover:underline text-xs">查看</router-link>
                <router-link :to="`/admin/articles/${row.id}/edit`" class="text-blue-600 dark:text-blue-400 hover:underline text-xs">编辑</router-link>
                <router-link
                  v-if="hasUnresolvedLocalImages(row.content)"
                  :to="`/admin/articles/${row.id}/edit?supplement=img`"
                  class="text-amber-600 dark:text-amber-400 hover:underline text-xs font-medium"
                >
                  图片补充
                </router-link>
                <button @click="handleExport(row)" class="text-gray-600 dark:text-gray-400 hover:underline text-xs">导出</button>
                <button @click="handleDelete(row.id)" class="text-red-500 dark:text-red-400 hover:underline text-xs">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="data.records.length === 0">
            <td colspan="8" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">暂无文章</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="flex justify-center mt-4" v-if="data.total > 0">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="data.total"
        :page-size="size"
        :current-page="page"
        @current-change="onPageChange"
      />
    </div>

    <!-- 批量导入 Markdown 弹窗 -->
    <el-dialog
      v-model="batchModalVisible"
      title="批量导入 Markdown 文章"
      width="680px"
      :close-on-click-modal="!isBatchUploading"
      :close-on-press-escape="!isBatchUploading"
      @closed="handleModalClosed"
    >
      <div class="space-y-4">
        <!-- 未开始上传或正在选择时的投放与选择区 -->
        <template v-if="!batchResult">
          <!-- 拖拽 / 点击投放框 -->
          <div
            class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 group"
            :class="isModalDragOver ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20' : 'border-gray-300 dark:border-gray-700 hover:border-indigo-500 bg-gray-50/50 dark:bg-gray-800/40'"
            @dragover.prevent="isModalDragOver = true"
            @dragleave.prevent="isModalDragOver = false"
            @drop.prevent="handleModalDrop"
            @click="triggerBatchFileSelect"
          >
            <input
              type="file"
              ref="batchFileInputRef"
              multiple
              accept=".md,.markdown"
              class="hidden"
              @change="handleBatchFileSelect"
            />
            <input
              type="file"
              ref="batchFolderInputRef"
              webkitdirectory
              directory
              class="hidden"
              @change="handleBatchFileSelect"
            />
            <div class="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <el-icon><UploadFilled /></el-icon>
            </div>
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              点击选择文件 / <span class="text-indigo-600 dark:text-indigo-400 hover:underline" @click.stop="triggerBatchFolderSelect">选择文件夹</span> 或直接将文件/文件夹拖拽至此
            </div>
            <div class="text-xs text-gray-400 dark:text-gray-500 max-w-md leading-relaxed">
              支持 Hexo、Hugo、VuePress、Obsidian 等导出的 Markdown 文档。支持直接拖入包含多个文档的整个文件夹（支持自动递归子目录提取）。
            </div>
          </div>

          <!-- 兜底默认分类选择 -->
          <div class="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/60 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
            <div class="flex flex-col">
              <span class="font-medium text-gray-700 dark:text-gray-200">兜底默认分类（可选）</span>
              <span class="text-gray-400 dark:text-gray-500">当文档未在其 Front-matter 中指定分类时，将自动归入此分类</span>
            </div>
            <select
              v-model="defaultCategoryId"
              class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[140px]"
            >
              <option :value="undefined">不设默认分类</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <!-- 待导入文件清单 -->
          <div v-if="selectedFiles.length > 0" class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-gray-700 dark:text-gray-300">
                待导入文件（已选择 {{ selectedFiles.length }} 篇，共 {{ totalSelectedSizeStr }}）
              </span>
              <button
                type="button"
                @click="clearSelectedFiles"
                class="text-gray-400 hover:text-red-500 transition text-xs"
              >
                清空文件
              </button>
            </div>
            <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <div
                v-for="(file, index) in selectedFiles"
                :key="file.name + index"
                class="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800"
              >
                <div class="flex items-center gap-2 truncate flex-1 mr-2">
                  <el-icon class="text-gray-400 shrink-0"><Document /></el-icon>
                  <span class="truncate font-medium text-gray-700 dark:text-gray-300">{{ file.name }}</span>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="text-gray-400 dark:text-gray-500 text-[11px]">{{ formatFileSize(file.size) }}</span>
                  <button
                    type="button"
                    @click="removeSelectedFile(index)"
                    class="text-gray-300 hover:text-red-500 transition"
                    title="移除此文件"
                  >
                    <el-icon><Close /></el-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 导入结果展示面板 -->
        <template v-else>
          <div class="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
            <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <span class="font-bold text-sm text-gray-800 dark:text-gray-100">批量导入完成</span>
              <div class="flex items-center gap-2 text-xs">
                <span class="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  总计: {{ batchResult.totalCount }}
                </span>
                <span class="px-2 py-0.5 rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                  成功: {{ batchResult.successCount }}
                </span>
                <span
                  v-if="batchResult.failCount > 0"
                  class="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                >
                  失败: {{ batchResult.failCount }}
                </span>
              </div>
            </div>

            <!-- 结果列表明细 -->
            <div class="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              <div
                v-for="(rec, idx) in batchResult.records"
                :key="idx"
                class="flex items-center justify-between text-xs p-2.5 rounded-lg border"
                :class="rec.success ? 'bg-green-50/60 dark:bg-green-950/30 border-green-200 dark:border-green-800/60' : 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-800/60'"
              >
                <div class="flex items-center gap-2 truncate flex-1 mr-2">
                  <el-icon v-if="rec.success" class="text-green-600 dark:text-green-400 shrink-0"><Check /></el-icon>
                  <el-icon v-else class="text-red-500 dark:text-red-400 shrink-0"><WarningFilled /></el-icon>
                  <span class="truncate font-medium text-gray-800 dark:text-gray-200" :title="rec.title || rec.originalFilename">
                    {{ rec.title || rec.originalFilename }}
                  </span>
                  <span v-if="rec.title && rec.originalFilename !== rec.title" class="text-[11px] text-gray-400 truncate">
                    ({{ rec.originalFilename }})
                  </span>
                </div>
                <div class="shrink-0 text-[11px]">
                  <span v-if="rec.success" class="text-green-600 dark:text-green-400 font-medium">
                    草稿已生成 (ID: {{ rec.articleId }})
                  </span>
                  <span v-else class="text-red-500 dark:text-red-400" :title="rec.errorMessage">
                    {{ rec.errorMessage || '导入失败' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <template #footer>
        <div class="flex justify-between items-center w-full">
          <div class="text-xs text-gray-400">
            <span v-if="!batchResult && selectedFiles.length > 0">已就绪 {{ selectedFiles.length }} 篇文档</span>
            <span v-else-if="batchResult">已自动存为文章草稿状态</span>
          </div>
          <div class="flex gap-2">
            <template v-if="!batchResult">
              <el-button @click="batchModalVisible = false" :disabled="isBatchUploading">取消</el-button>
              <el-button
                type="primary"
                :loading="isBatchUploading"
                :disabled="selectedFiles.length === 0"
                @click="submitBatchImport"
              >
                {{ isBatchUploading ? '正在极速入库中...' : `开始批量导入 (${selectedFiles.length})` }}
              </el-button>
            </template>
            <template v-else>
              <el-button @click="resetBatchState">继续批量导入</el-button>
              <el-button type="primary" @click="finishBatchModal">完成并刷新列表</el-button>
            </template>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 批量修改分类弹窗 -->
    <el-dialog
      v-model="batchCategoryDialogVisible"
      title="批量修改文章分类"
      width="460px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="space-y-3 py-1">
        <p class="text-xs text-gray-600 dark:text-gray-300">
          即将把选中的 <span class="font-bold text-indigo-600 dark:text-indigo-400">{{ selectedArticleIds.length }}</span> 篇文章批量移动到以下指定分类：
        </p>
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            目标分类
          </label>
          <select
            v-model="targetBatchCategoryId"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option :value="null">设置为未分类（清空分类）</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="batchCategoryDialogVisible = false" :disabled="isBatchChangingCategory">取消</el-button>
          <el-button type="primary" :loading="isBatchChangingCategory" @click="handleConfirmBatchCategory">
            {{ isBatchChangingCategory ? '正在批量更新中...' : '确认迁移' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量设置标签弹窗 -->
    <el-dialog
      v-model="batchTagDialogVisible"
      title="批量设置文章标签"
      width="520px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="space-y-4 py-1">
        <p class="text-xs text-gray-600 dark:text-gray-300">
          已勾选 <span class="font-bold text-primary">{{ selectedArticleIds.length }}</span> 篇文章，请选择标签处理方式及目标标签：
        </p>

        <!-- 模式选择 -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            处理模式
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="batchTagMode = 'append'"
              class="px-3 py-2 rounded-xl text-xs font-medium border text-center transition"
              :class="batchTagMode === 'append' ? 'border-primary bg-blue-50 dark:bg-blue-950/40 text-primary font-bold ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
            >
              <div>追加标签</div>
              <div class="text-[10px] text-gray-400 font-normal mt-0.5">保留原标签并新增</div>
            </button>
            <button
              type="button"
              @click="batchTagMode = 'replace'"
              class="px-3 py-2 rounded-xl text-xs font-medium border text-center transition"
              :class="batchTagMode === 'replace' ? 'border-primary bg-blue-50 dark:bg-blue-950/40 text-primary font-bold ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
            >
              <div>覆盖替换</div>
              <div class="text-[10px] text-gray-400 font-normal mt-0.5">清空原有全部重设</div>
            </button>
            <button
              type="button"
              @click="batchTagMode = 'remove'"
              class="px-3 py-2 rounded-xl text-xs font-medium border text-center transition"
              :class="batchTagMode === 'remove' ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 font-bold ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
            >
              <div>批量移除</div>
              <div class="text-[10px] text-gray-400 font-normal mt-0.5">剔除选中的标签</div>
            </button>
          </div>
        </div>

        <!-- 标签选择云 -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              选择目标标签（已选 {{ selectedBatchTagIds.length }} 个）
            </label>
            <button
              v-if="selectedBatchTagIds.length > 0"
              type="button"
              @click="selectedBatchTagIds = []"
              class="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              清空所选
            </button>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            <button
              v-for="tag in systemTags"
              :key="tag.id"
              type="button"
              @click="toggleBatchTagSelect(tag.id)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition-all active:scale-95 select-none"
              :style="isBatchTagSelected(tag.id)
                ? {
                    color: tag.color || '#315fbd',
                    backgroundColor: (tag.color || '#315fbd') + '22',
                    borderColor: tag.color || '#315fbd',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                  }
                : {
                    color: 'var(--text-sub, #6b7280)',
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(156, 163, 175, 0.4)'
                  }"
            >
              <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: tag.color || '#315fbd' }"></span>
              <span>{{ tag.name }}</span>
              <el-icon v-if="isBatchTagSelected(tag.id)" class="text-xs ml-0.5"><Check /></el-icon>
            </button>
            <span v-if="systemTags.length === 0" class="text-xs text-gray-400 py-2">
              暂无可用标签，请先前往标签管理创建
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="batchTagDialogVisible = false" :disabled="isBatchChangingTags">取消</el-button>
          <el-button
            type="primary"
            :loading="isBatchChangingTags"
            :disabled="selectedBatchTagIds.length === 0"
            @click="handleConfirmBatchTags"
          >
            {{ isBatchChangingTags ? '正在批量处理中...' : '确认应用' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  getAdminArticles,
  getAdminArticleDetail,
  updateArticle,
  deleteArticle,
  importArticlesBatch,
  PageResult,
  ArticleItem,
  ArticleImportVO
} from '../../api/article'
import { getCategories, Category } from '../../api/category'
import { getTags, createTag, Tag } from '../../api/tag'
import { formatFileSize } from '../../utils/batchUpload'
import { downloadArticleAsMarkdown } from '../../utils/markdownExport'
import { getAllFilesFromDataTransfer } from '../../utils/dragDrop'
import { hasUnresolvedLocalImages } from '../../utils/markdownParser'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Document, Close, Check, WarningFilled, ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const keyword = ref('')
const categoryFilter = ref<string | number>('')
const statusFilter = ref('')
const page = ref(1)
const size = ref(10)
const data = ref<PageResult<ArticleItem>>({ total: 0, page: 1, size: 10, records: [] })

// 批量选择状态
const selectedArticleIds = ref<number[]>([])
const isAllSelected = computed(() => {
  return data.value.records.length > 0 && data.value.records.every((r) => selectedArticleIds.value.includes(r.id))
})
const isIndeterminate = computed(() => {
  return selectedArticleIds.value.length > 0 && !isAllSelected.value
})

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedArticleIds.value = []
  } else {
    selectedArticleIds.value = data.value.records.map((r) => r.id)
  }
}

// 批量修改分类相关响应式状态
const batchCategoryDialogVisible = ref(false)
const targetBatchCategoryId = ref<number | null>(null)
const isBatchChangingCategory = ref(false)

function openBatchCategoryDialog() {
  if (selectedArticleIds.value.length === 0) {
    ElMessage.warning('请先勾选需要修改分类的文章')
    return
  }
  targetBatchCategoryId.value = null
  batchCategoryDialogVisible.value = true
}

async function handleConfirmBatchCategory() {
  if (selectedArticleIds.value.length === 0) return
  isBatchChangingCategory.value = true

  try {
    let successCount = 0
    const promises = selectedArticleIds.value.map(async (id) => {
      try {
        const detail = await getAdminArticleDetail(id)
        await updateArticle(id, {
          title: detail.title,
          summary: detail.summary || '',
          content: detail.content || '',
          cover: detail.cover || '',
          categoryId: targetBatchCategoryId.value || undefined,
          tagIds: detail.tags?.map((t) => t.id) || [],
          isTop: detail.isTop,
          status: detail.status,
        })
        successCount++
      } catch {
        // individual fail
      }
    })

    await Promise.all(promises)
    ElMessage.success(`成功将 ${successCount} 篇文章修改至目标分类！`)
    batchCategoryDialogVisible.value = false
    selectedArticleIds.value = []
    fetchData()
  } catch (err: any) {
    ElMessage.error(err.message || '批量修改分类失败')
  } finally {
    isBatchChangingCategory.value = false
  }
}

// 标签数据与快捷/批量标签响应式状态
const systemTags = ref<Tag[]>([])

// 行内气泡快捷设置标签状态与实例引用
const popoverVisibleMap = ref<Record<number, boolean>>({})
const popoverRefs = ref<Record<number, any>>({})
function getPopoverRefSetter(rowId: number) {
  return (el: any) => {
    if (el) {
      popoverRefs.value[rowId] = el
    } else {
      delete popoverRefs.value[rowId]
    }
  }
}

const activeTagArticle = ref<ArticleItem | null>(null)
const activeSelectedTagIds = ref<number[]>([])
const popoverTagKeyword = ref('')
const newTagNameInPopover = ref('')
const isSavingRowTags = ref(false)

// 批量设置标签相关响应式状态
const batchTagDialogVisible = ref(false)
const batchTagMode = ref<'append' | 'replace' | 'remove'>('append')
const selectedBatchTagIds = ref<number[]>([])
const isBatchChangingTags = ref(false)

// 气泡内过滤展示的标签列表
const filteredSystemTags = computed(() => {
  const kw = popoverTagKeyword.value.trim().toLowerCase()
  if (!kw) return systemTags.value
  return systemTags.value.filter((t) => t.name.toLowerCase().includes(kw))
})

// 行内气泡事件处理
function openEditTagsPopover(row: ArticleItem) {
  // 如果当前已经打开该行，则切换关闭
  if (popoverVisibleMap.value[row.id]) {
    closeActiveTagPopover(row)
    return
  }
  // 关闭其他打开的行气泡
  Object.keys(popoverVisibleMap.value).forEach((k) => {
    popoverVisibleMap.value[Number(k)] = false
  })
  popoverVisibleMap.value[row.id] = true
  initEditTagsForArticle(row)
}

function initEditTagsForArticle(row: ArticleItem) {
  activeTagArticle.value = row
  activeSelectedTagIds.value = (row.tags || []).map((t) => Number(t.id))
  popoverTagKeyword.value = ''
  newTagNameInPopover.value = ''
  // 异步静默拉取一次标签，确保最新标签立即可见
  getTags()
    .then((tags) => {
      systemTags.value = tags
    })
    .catch(() => {})
}

function isTagActive(tagId: number | string): boolean {
  const target = Number(tagId)
  return activeSelectedTagIds.value.some((id) => Number(id) === target)
}

function toggleActiveTag(tagId: number | string) {
  const target = Number(tagId)
  const idx = activeSelectedTagIds.value.findIndex((id) => Number(id) === target)
  if (idx > -1) {
    activeSelectedTagIds.value.splice(idx, 1)
  } else {
    activeSelectedTagIds.value.push(target)
  }
}

async function handleCreateTagInPopover() {
  const name = newTagNameInPopover.value.trim()
  if (!name) return

  // 检查是否已有同名标签（不区分大小写）
  const existing = systemTags.value.find((t) => t.name.toLowerCase() === name.toLowerCase())
  if (existing) {
    if (!isTagActive(existing.id)) {
      activeSelectedTagIds.value.push(Number(existing.id))
    }
    newTagNameInPopover.value = ''
    ElMessage.info(`标签「${existing.name}」已存在，已为您直接选中`)
    return
  }

  try {
    const colors = [
      '#315fbd', '#2563eb', '#0284c7', '#0d9488', '#10b981',
      '#16a34a', '#84cc16', '#eab308', '#f97316', '#ea580c',
      '#ef4444', '#e11d48', '#db2777', '#a855f7', '#7c3aed'
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    await createTag({ name, color: randomColor })
    const updatedTags = await getTags()
    systemTags.value = updatedTags
    const newlyCreated = updatedTags.find((t) => t.name.toLowerCase() === name.toLowerCase())
    if (newlyCreated && !isTagActive(newlyCreated.id)) {
      activeSelectedTagIds.value.push(Number(newlyCreated.id))
    }
    newTagNameInPopover.value = ''
    ElMessage.success(`标签「${name}」已创建并选中`)
  } catch (err: any) {
    ElMessage.error(err.message || '创建标签失败')
  }
}

function closeActiveTagPopover(row?: ArticleItem) {
  const targetId = row?.id || activeTagArticle.value?.id
  if (targetId) {
    popoverVisibleMap.value[targetId] = false
    popoverRefs.value[targetId]?.hide?.()
  }
  Object.keys(popoverVisibleMap.value).forEach((k) => {
    popoverVisibleMap.value[Number(k)] = false
  })
  Object.values(popoverRefs.value).forEach((r: any) => {
    r?.hide?.()
  })

  // 恢复文章原有的标签选择状态，取消临时改动
  const originRow = row || activeTagArticle.value
  if (originRow?.tags) {
    activeSelectedTagIds.value = originRow.tags.map((t) => Number(t.id))
  } else {
    activeSelectedTagIds.value = []
  }
}

async function handleSaveRowTags(row?: ArticleItem) {
  const targetRow = row || activeTagArticle.value
  if (!targetRow) return

  isSavingRowTags.value = true
  try {
    const detail = await getAdminArticleDetail(targetRow.id)
    const finalTagIds = activeSelectedTagIds.value.map((id) => Number(id))
    await updateArticle(targetRow.id, {
      title: detail.title,
      summary: detail.summary || '',
      content: detail.content || '',
      cover: detail.cover || '',
      categoryId: detail.category?.id || undefined,
      tagIds: finalTagIds,
      isTop: detail.isTop,
      status: detail.status,
    })
    targetRow.tags = systemTags.value.filter((t) => isTagActive(t.id))
    ElMessage.success(`文章「${targetRow.title}」标签更新成功`)
    closeActiveTagPopover(targetRow)
  } catch (err: any) {
    ElMessage.error(err.message || '更新标签失败')
  } finally {
    isSavingRowTags.value = false
  }
}

// 批量设置标签弹窗逻辑
function openBatchTagDialog() {
  if (selectedArticleIds.value.length === 0) {
    ElMessage.warning('请先勾选需要设置标签的文章')
    return
  }
  batchTagMode.value = 'append'
  selectedBatchTagIds.value = []
  batchTagDialogVisible.value = true
  getTags()
    .then((tags) => {
      systemTags.value = tags
    })
    .catch(() => {})
}

function isBatchTagSelected(tagId: number | string): boolean {
  const target = Number(tagId)
  return selectedBatchTagIds.value.some((id) => Number(id) === target)
}

function toggleBatchTagSelect(tagId: number | string) {
  const target = Number(tagId)
  const idx = selectedBatchTagIds.value.findIndex((id) => Number(id) === target)
  if (idx > -1) {
    selectedBatchTagIds.value.splice(idx, 1)
  } else {
    selectedBatchTagIds.value.push(target)
  }
}

async function handleConfirmBatchTags() {
  if (selectedArticleIds.value.length === 0 || selectedBatchTagIds.value.length === 0) return
  isBatchChangingTags.value = true

  try {
    let successCount = 0
    const promises = selectedArticleIds.value.map(async (id) => {
      try {
        const detail = await getAdminArticleDetail(id)
        let newTagIds: number[] = []
        const existingIds = (detail.tags?.map((t) => Number(t.id)) || [])
        const batchIds = selectedBatchTagIds.value.map((t) => Number(t))

        if (batchTagMode.value === 'append') {
          newTagIds = Array.from(new Set([...existingIds, ...batchIds]))
        } else if (batchTagMode.value === 'replace') {
          newTagIds = [...batchIds]
        } else if (batchTagMode.value === 'remove') {
          newTagIds = existingIds.filter((tId) => !batchIds.includes(tId))
        }

        await updateArticle(id, {
          title: detail.title,
          summary: detail.summary || '',
          content: detail.content || '',
          cover: detail.cover || '',
          categoryId: detail.category?.id || undefined,
          tagIds: newTagIds,
          isTop: detail.isTop,
          status: detail.status,
        })
        successCount++
      } catch {
        // individual fail
      }
    })

    await Promise.all(promises)
    ElMessage.success(`成功为 ${successCount} 篇文章批量更新标签！`)
    batchTagDialogVisible.value = false
    selectedArticleIds.value = []
    selectedBatchTagIds.value = []
    fetchData()
  } catch (err: any) {
    ElMessage.error(err.message || '批量更新标签失败')
  } finally {
    isBatchChangingTags.value = false
  }
}

function onCategoryFilterChange() {
  page.value = 1
  selectedArticleIds.value = []
  fetchData()
}

// 分类列表供默认分类下拉框使用
const categories = ref<Category[]>([])

// 批量导入相关响应式状态
const batchModalVisible = ref(false)
const isModalDragOver = ref(false)
const isBatchUploading = ref(false)
const batchFileInputRef = ref<HTMLInputElement | null>(null)
const batchFolderInputRef = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<File[]>([])
const defaultCategoryId = ref<number | undefined>(undefined)
const batchResult = ref<ArticleImportVO | null>(null)

// 页面全局拖拽监听状态
let pageDragCounter = 0
const isPageDragOver = ref(false)

const totalSelectedSizeStr = computed(() => {
  const total = selectedFiles.value.reduce((acc, f) => acc + f.size, 0)
  return formatFileSize(total)
})

function handlePageDragEnter(e: DragEvent) {
  if (e.dataTransfer?.types?.includes('Files')) {
    pageDragCounter++
    isPageDragOver.value = true
  }
}

function handlePageDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

function handlePageDragLeave() {
  pageDragCounter--
  if (pageDragCounter <= 0) {
    pageDragCounter = 0
    isPageDragOver.value = false
  }
}

async function handlePageDrop(e: DragEvent) {
  pageDragCounter = 0
  isPageDragOver.value = false
  if (!e.dataTransfer) return

  const files = await getAllFilesFromDataTransfer(e.dataTransfer)
  const mdFiles = filterMdFiles(files)

  if (mdFiles.length > 0) {
    addFilesToQueue(mdFiles)
    batchModalVisible.value = true
    ElMessage.success(`已加入 ${mdFiles.length} 篇 Markdown 文件至导入队列`)
  }
}

function triggerBatchFileSelect() {
  batchFileInputRef.value?.click()
}

function triggerBatchFolderSelect() {
  batchFolderInputRef.value?.click()
}

function handleBatchFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  const mdFiles = filterMdFiles(files)
  if (mdFiles.length > 0) {
    addFilesToQueue(mdFiles)
  }
  target.value = ''
}

async function handleModalDrop(e: DragEvent) {
  isModalDragOver.value = false
  if (!e.dataTransfer) return

  const files = await getAllFilesFromDataTransfer(e.dataTransfer)
  const mdFiles = filterMdFiles(files)
  if (mdFiles.length > 0) {
    addFilesToQueue(mdFiles)
  }
}

function filterMdFiles(files: File[]): File[] {
  const valid = files.filter(
    (f) => f.name.toLowerCase().endsWith('.md') || f.name.toLowerCase().endsWith('.markdown')
  )
  if (files.length > 0 && valid.length === 0) {
    ElMessage.warning('未能识别到有效的 Markdown (.md) 文件！')
  } else if (valid.length < files.length && valid.length > 0) {
    ElMessage.info(`已自动过滤 ${files.length - valid.length} 个非 Markdown 资源文件`)
  }
  return valid
}

function addFilesToQueue(files: File[]) {
  // 根据文件名和大小做简单去重
  const existingKeys = new Set(selectedFiles.value.map((f) => `${f.name}-${f.size}`))
  const newFiles: File[] = []
  for (const f of files) {
    const key = `${f.name}-${f.size}`
    if (!existingKeys.has(key)) {
      existingKeys.add(key)
      newFiles.push(f)
    }
  }
  selectedFiles.value.push(...newFiles)
}

function removeSelectedFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

function clearSelectedFiles() {
  selectedFiles.value = []
}

function openBatchImportModal() {
  batchModalVisible.value = true
}

function resetBatchState() {
  batchResult.value = null
  selectedFiles.value = []
}

function handleModalClosed() {
  isModalDragOver.value = false
  if (batchResult.value && batchResult.value.successCount > 0) {
    fetchData()
  }
}

function finishBatchModal() {
  batchModalVisible.value = false
  fetchData()
}

async function submitBatchImport() {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('请先选择或拖入 Markdown 文件！')
    return
  }

  isBatchUploading.value = true
  try {
    const res = await importArticlesBatch(selectedFiles.value, defaultCategoryId.value)
    batchResult.value = res
    if (res.successCount > 0) {
      ElMessage.success(`成功导入 ${res.successCount} 篇草稿文章！`)
    }
    if (res.failCount > 0) {
      ElMessage.warning(`其中 ${res.failCount} 篇导入失败，请查看明细原因`)
    }
  } catch {
    ElMessage.error('批量导入请求失败，请稍后重试')
  } finally {
    isBatchUploading.value = false
  }
}

async function handleExport(row: ArticleItem) {
  const loadingMsg = ElMessage.info({
    message: '正在导出 ZIP 压缩包...',
    duration: 0
  })

  try {
    const article = await getAdminArticleDetail(row.id)
    await downloadArticleAsMarkdown({
      title: article.title,
      content: article.content || '',
      summary: article.summary,
      cover: article.cover,
      categoryName: article.category?.name,
      tagNames: article.tags?.map((t) => t.name),
      date: article.createTime,
    })
    loadingMsg.close()
    ElMessage.success('文章导出成功')
  } catch {
    loadingMsg.close()
    ElMessage.error('导出失败')
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  if (route.query.categoryId) {
    categoryFilter.value = Number(route.query.categoryId)
  }
  fetchData()
  try {
    categories.value = await getCategories()
  } catch {
    // ignore
  }
  try {
    systemTags.value = await getTags()
  } catch {
    // ignore
  }
})

async function fetchData() {
  const params: any = { page: page.value, size: size.value }
  if (keyword.value) params.keyword = keyword.value
  if (categoryFilter.value !== '') params.categoryId = categoryFilter.value
  if (statusFilter.value !== '') params.status = statusFilter.value === 'true'
  data.value = await getAdminArticles(params)
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    selectedArticleIds.value = []
    fetchData()
  }, 300)
}

function onPageChange(p: number) {
  page.value = p
  selectedArticleIds.value = []
  fetchData()
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '确认删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteArticle(id)
    ElMessage.success('删除成功')
    fetchData()
  } catch {
    // cancelled
  }
}

async function handleQuickChangeCategory(row: ArticleItem, newCategoryId: number | null) {
  try {
    const detail = await getAdminArticleDetail(row.id)
    await updateArticle(row.id, {
      title: detail.title,
      summary: detail.summary || '',
      content: detail.content || '',
      cover: detail.cover || '',
      categoryId: newCategoryId || undefined,
      tagIds: detail.tags?.map((t) => t.id) || [],
      isTop: detail.isTop,
      status: detail.status,
    })
    ElMessage.success(`文章「${row.title}」分类已更新`)
    fetchData()
  } catch (err: any) {
    ElMessage.error(err.message || '更新分类失败')
  }
}
</script>
