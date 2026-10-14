<template>
  <div
    class="relative min-h-[600px]"
    @dragenter.prevent="handlePageDragEnter"
    @dragover.prevent="handlePageDragOver"
    @dragleave.prevent="handlePageDragLeave"
    @drop.prevent="handlePageDrop"
  >
    <!-- 全局拖入 Markdown 浮层提示 -->
    <div
      v-if="isPageMdDragOver"
      class="fixed inset-0 z-50 bg-blue-600/15 dark:bg-blue-500/25 backdrop-blur-[3px] border-4 border-dashed border-primary flex flex-col items-center justify-center pointer-events-none transition-all"
    >
      <div class="bg-white/95 dark:bg-gray-800/95 px-8 py-6 rounded-2xl shadow-2xl border border-primary/30 flex items-center gap-4 text-center">
        <el-icon class="text-4xl text-primary animate-bounce"><UploadFilled /></el-icon>
        <div>
          <div class="text-base font-bold text-gray-800 dark:text-gray-100">松开鼠标即可导入该 Markdown 文档</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">自动解析 Front-matter 元数据、首行标题与摘要，并识别本地图片</div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-3">
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">{{ isEdit ? '编辑文章' : '新建文章' }}</h1>
        <router-link
          v-if="isEdit"
          :to="`/article/${$route.params.id}`"
          target="_blank"
          class="text-xs text-primary hover:underline flex items-center gap-1 font-medium bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800/50 transition"
          title="在新标签页中查看前台文章详情"
        >
          <span>查看前台</span>
        </router-link>
      </div>
      <div class="flex gap-2">
        <button v-if="isEdit" type="button" @click="exportCurrentMd" class="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition flex items-center gap-1 shadow-sm">
          导出为Markdown
        </button>
        <button
          v-if="unresolvedImagesCount > 0"
          type="button"
          @click="openImageSupplementModal"
          class="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-1.5 shadow-sm font-medium"
          title="检测并一键转存正文中的本地图片"
        >
          <el-icon><Picture /></el-icon>
          <span>图片补充 ({{ unresolvedImagesCount }})</span>
        </button>
        <button
          type="button"
          @click="triggerMdSelect"
          @dragover.prevent
          @drop.prevent="handleButtonMdDrop"
          class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1.5 shadow-sm"
          title="点击选择文件或直接拖拽 .md 文件到此处"
        >
          <el-icon><UploadFilled /></el-icon>
          <span>导入 Markdown </span>
        </button>
        <input
          type="file"
          ref="mdFileInput"
          accept=".mdnvm"
          class="hidden"
          @change="handleMdFileLoad"
        />
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">标题 *</label>
        <input v-model="form.title" required class="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">摘要</label>
        <textarea
          v-model="form.summary"
          rows="2"
          class="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="可在此输入或拖入文本/摘要"
          @drop="handleSummaryDrop"
        ></textarea>
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">封面图</label>
        <CoverUpload v-model="form.cover" />
      </div>

      <div>
        <div class="mb-1">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">正文 *</label>
        </div>
        <MarkdownEditor v-model="form.content" @drop-md-file="processDroppedMdFile" />
      </div>

      <div class="flex gap-4">
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">分类</label>
            <button
              type="button"
              @click="openQuickCatDialog"
              class="text-xs text-primary hover:underline font-medium flex items-center gap-0.5"
              title="写文章时快捷新建分类，无需离开页面"
            >
              快捷新建分类
            </button>
          </div>
          <select v-model="form.categoryId" class="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option :value="undefined">无分类</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <div class="flex-1">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">文章标签</label>
          <div class="mt-2 flex flex-wrap gap-2">
            <label
              v-for="tag in tags"
              :key="tag.id"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-all duration-150 select-none active:scale-95"
              :style="form.tagIds.includes(tag.id)
                ? {
                    color: tag.color || '#315fbd',
                    backgroundColor: (tag.color || '#315fbd') + '1c',
                    borderColor: (tag.color || '#315fbd') + '60',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                  }
                : {
                    color: 'var(--text-sub, #6b7280)',
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(156, 163, 175, 0.4)'
                  }"
            >
              <input type="checkbox" :value="tag.id" v-model="form.tagIds" class="hidden" />
              <span
                class="w-2 h-2 rounded-full transition-transform"
                :style="{ backgroundColor: tag.color || '#315fbd' }"
              ></span>
              <span>{{ tag.name }}</span>
            </label>
            <span v-if="!tags.length" class="text-xs text-gray-400">暂无标签，请先前往“标签管理”创建</span>
          </div>
        </div>
      </div>

      <!-- 附件管理卡片（支持批量上传与并发队列控制） -->
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mt-4 space-y-4">
        <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-2">
          <div>
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
              <span>文章附件库</span>
              <span class="text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
                支持批量多选 / 拖拽
              </span>
            </h3>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              前端并发调度，单文件最大 10MB，个别失败支持独立重试
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="attachmentBatch.tasks.value.length > 0 && !attachmentBatch.isUploading.value"
              type="button"
              @click="attachmentBatch.clearDoneTasks"
              class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              清空队列记录
            </button>
          </div>
        </div>

        <!-- 批量上传触发与拖拽投放区 -->
        <div
          class="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1 group"
          :class="isAttachmentDragOver ? 'border-primary bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-primary/20' : 'border-gray-200 dark:border-gray-700 hover:border-primary/60 bg-gray-50/50 dark:bg-gray-800/40'"
          @dragover.prevent="isAttachmentDragOver = true"
          @dragleave.prevent="isAttachmentDragOver = false"
          @drop.prevent="onDropAttachments"
          @click="triggerAttachmentSelect"
        >
          <input
            type="file"
            ref="attachmentFileInput"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.rar,.tar,.gz,.7z"
            class="hidden"
            @change="handleAttachmentFileSelect"
          />
          <el-icon class="text-2xl text-gray-400 group-hover:text-primary transition-colors">
            <UploadFilled />
          </el-icon>
          <div class="text-xs font-medium text-gray-700 dark:text-gray-300">
            点击批量选择附件 或 直接将多个文件拖拽至此
          </div>
          <div class="text-[11px] text-gray-400 dark:text-gray-500">
            支持同时选择/拖入多个 PDF、ZIP、Word、Excel 等文件并发上传
          </div>
        </div>

        <!-- 批量上传任务队列监控面板 -->
        <div v-if="attachmentBatch.tasks.value.length > 0" class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800 space-y-2.5">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-700 dark:text-gray-300">
                上传任务队列
              </span>
              <span class="text-gray-400">
                (已完成 {{ attachmentBatch.completedCount.value }}/{{ attachmentBatch.totalCount.value }})
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="attachmentBatch.isUploading.value" class="text-primary font-medium">
                并发上传中 {{ attachmentBatch.overallPercent.value }}%
              </span>
              <button
                v-if="attachmentBatch.hasFailed.value"
                type="button"
                @click="attachmentBatch.retryAllFailed"
                class="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-0.5"
              >
                <el-icon><RefreshRight /></el-icon> 重试失败项
              </button>
            </div>
          </div>

          <!-- 任务列表 -->
          <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            <div
              v-for="task in attachmentBatch.tasks.value"
              :key="task.id"
              class="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800 text-xs flex items-center justify-between gap-3 shadow-xs"
            >
              <div class="flex items-center gap-2 truncate flex-1">
                <el-icon class="text-gray-400 shrink-0"><Document /></el-icon>
                <span class="truncate font-medium text-gray-700 dark:text-gray-300" :title="task.name">
                  {{ task.name }}
                </span>
                <span class="text-[11px] text-gray-400 shrink-0">({{ formatFileSize(task.size) }})</span>
              </div>

              <!-- 状态与进度 -->
              <div class="flex items-center gap-2 shrink-0">
                <template v-if="task.status === 'uploading'">
                  <div class="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full bg-primary transition-all duration-200" :style="{ width: task.progress + '%' }"></div>
                  </div>
                  <span class="text-primary text-[11px] w-8 text-right font-mono">{{ task.progress }}%</span>
                </template>
                <template v-else-if="task.status === 'pending'">
                  <span class="text-gray-400 text-[11px]">排队中</span>
                </template>
                <template v-else-if="task.status === 'success'">
                  <span class="text-green-600 dark:text-green-400 text-[11px] flex items-center gap-0.5">
                    <el-icon><Check /></el-icon> 已完成
                  </span>
                </template>
                <template v-else-if="task.status === 'error'">
                  <span class="text-red-500 text-[11px] flex items-center gap-0.5" :title="task.error">
                    <el-icon><WarningFilled /></el-icon> 失败
                  </span>
                  <button
                    type="button"
                    @click="attachmentBatch.retryTask(task.id)"
                    class="text-blue-600 hover:underline text-[11px]"
                  >
                    重试
                  </button>
                </template>

                <button
                  type="button"
                  @click="attachmentBatch.removeTask(task.id)"
                  class="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400"
                  title="移除记录"
                >
                  <el-icon><Close /></el-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 已保存附件列表 -->
        <div v-if="attachments.length > 0" class="space-y-2">
          <div class="text-xs font-semibold text-gray-600 dark:text-gray-400">已就绪附件列表（{{ attachments.length }}）</div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <div v-for="(file, index) in attachments" :key="index" class="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 animate-fade-in">
              <span class="truncate font-medium text-gray-700 dark:text-gray-300 flex-1 mr-2">{{ file.filename }}</span>
              <div class="flex gap-2 shrink-0">
                <button type="button" @click="insertAttachmentLink(file)" class="text-blue-600 dark:text-blue-400 hover:underline">
                  复制 Markdown 链接
                </button>
                <button type="button" @click="copyLink(file.url)" class="text-gray-500 dark:text-gray-400 hover:underline">
                  复制链接
                </button>
                <button type="button" @click="removeAttachment(index)" class="text-red-500 dark:text-red-400 hover:underline">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="attachmentBatch.tasks.value.length === 0" class="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
          暂无上传的附件
        </div>
      </div>

      <div class="flex gap-4">
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" v-model="form.isTop" />
          置顶
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" v-model="form.status" />
          发布
        </label>
      </div>

      <div class="flex gap-2">
        <button type="submit" class="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition">
          {{ isEdit ? '保存' : '发布' }}
        </button>
        <router-link to="/admin/articles" class="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          取消
        </router-link>
      </div>
    </form>

    <!-- 文章正文图片补充与转存弹窗 -->
    <el-dialog
      v-model="showDragDropModal"
      title="文章正文图片补充与转存"
      width="640px"
      :close-on-click-modal="false"
      @closed="handleSupplementModalClosed"
    >
      <div class="space-y-4">
        <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          检测到文章正文中包含本地图片引用。系统支持<strong>从本地绝对路径一键读取导入</strong>、<strong>选取本地图片文件夹</strong>或<strong>直接拖拽图片文件</strong>，并发转存为在线图片并自动替换正文中的图片链接。
        </p>

        <!-- 本地路径读取与快捷导入面板 -->
        <div class="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-3.5 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1">
              <el-icon><FolderOpened /></el-icon> 本地图片存储路径
            </span>
            <span class="text-[11px] text-blue-600 dark:text-blue-400">
              {{ detectedLocalFolderPath ? '已自动识别路径' : '可手动输入所在本地目录' }}
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="detectedLocalFolderPath"
              placeholder="例如：D:\notes\assets 或 /Users/name/images"
              class="border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs flex-1 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <button
              type="button"
              :disabled="!detectedLocalFolderPath || isDirectImporting"
              @click="handleDirectLocalImport"
              class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs transition font-medium flex items-center gap-1 shadow-sm shrink-0"
              title="从该本地路径直接读取图片文件并批量转存入库"
            >
              <el-icon v-if="isDirectImporting" class="animate-spin"><RefreshRight /></el-icon>
              <el-icon v-else><Check /></el-icon>
              <span>一键本地导入</span>
            </button>
            <button
              v-if="detectedLocalFolderPath"
              type="button"
              @click="handleOpenFolder"
              class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg text-xs transition font-medium flex items-center gap-1 shrink-0"
              title="在系统资源管理器中打开此文件夹"
            >
              📁 打开
            </button>
          </div>
        </div>

        <!-- 待补充图片清单与转存状态 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-gray-700 dark:text-gray-300">
              待补充图片清单（{{ mdImages.filter(i => i.uploadedUrl).length }} / {{ mdImages.length }} 已完成）
            </span>
            <div class="flex gap-2">
              <button
                type="button"
                @click="triggerFolderSelect"
                class="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                📂 选取本地文件夹导入
              </button>
              <input
                type="file"
                ref="folderFileInputRef"
                webkitdirectory
                directory
                multiple
                class="hidden"
                @change="handleFolderFileSelect"
              />
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5">
            <div
              v-for="img in mdImages"
              :key="img.rawPath"
              class="flex items-center justify-between text-xs p-1.5 rounded-lg"
              :class="img.uploadedUrl ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700'"
            >
              <div class="flex items-center gap-2 truncate flex-1 mr-2">
                <el-icon v-if="img.uploadedUrl" class="text-green-600 dark:text-green-400"><Check /></el-icon>
                <el-icon v-else class="text-amber-500"><Picture /></el-icon>
                <span class="font-medium truncate">{{ img.filename }}</span>
                <span class="text-[11px] text-gray-400 truncate font-mono">({{ img.rawPath }})</span>
              </div>
              <span v-if="img.uploadedUrl" class="text-[11px] text-green-600 dark:text-green-400 font-medium shrink-0">
                已转存并替换
              </span>
              <span v-else class="text-[11px] text-amber-600 dark:text-amber-400 font-medium shrink-0">
                待补充
              </span>
            </div>
          </div>
        </div>

        <!-- 拖拽 / 点击选择图片投放区 -->
        <div
          class="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5"
          :class="isDragOver ? 'bg-green-50 dark:bg-green-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-400 text-blue-600 dark:text-blue-400'"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="onDropImages"
          @click="triggerImgSelect"
        >
          <input
            type="file"
            ref="imgFileInput"
            multiple
            accept="image/*"
            class="hidden"
            @change="handleImageFileSelect"
          />
          <el-icon class="text-2xl text-blue-500"><UploadFilled /></el-icon>
          <div class="text-xs font-semibold">
            {{ isDragOver ? '松开鼠标即可补充上传' : '点击选择本地图片 或 直接拖拽图片/文件夹至此' }}
          </div>
          <div class="text-[11px] text-gray-400 dark:text-gray-500">
            支持拖入单张/多张图片或图片文件夹（支持自动递归子目录），自动按文件名匹配并转存
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between items-center w-full">
          <el-button @click="closeSupplementModal">
            {{ isImportedFromLocalMd ? '取消导入' : '关闭' }}
          </el-button>
          <div class="flex gap-2">
            <el-button v-if="isImportedFromLocalMd && !mdImages.every(i => i.uploadedUrl)" type="warning" @click="forceImport">
              跳过未上传图片并直接导入
            </el-button>
            <el-button type="primary" :disabled="!mdImages.some(i => i.uploadedUrl)" @click="finishImageSupplement">
              完成并应用到正文
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 快捷新建分类弹窗 -->
    <el-dialog
      v-model="showQuickCatDialog"
      title="快捷新建文章分类"
      width="460px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="space-y-3 py-1">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            分类名称 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="quickCatForm.name"
            placeholder="例如: Vue3 深入, 算法精析"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            @blur="handleQuickCatNameBlur"
            @keyup.enter="handleQuickCreateCatSubmit"
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              URL 别名 (Slug)
            </label>
            <button
              type="button"
              @click="generateQuickCatSlug"
              class="text-[11px] text-primary hover:underline font-medium"
            >
              ⚡ 智能生成
            </button>
          </div>
          <input
            v-model="quickCatForm.slug"
            placeholder="例如: vue3-deep"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            @keyup.enter="handleQuickCreateCatSubmit"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            分类描述
          </label>
          <input
            v-model="quickCatForm.description"
            placeholder="简短描述（选填）"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            @keyup.enter="handleQuickCreateCatSubmit"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="showQuickCatDialog = false" :disabled="isQuickCreatingCat">取消</el-button>
          <el-button type="primary" :loading="isQuickCreatingCat" @click="handleQuickCreateCatSubmit">创建并选中</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminArticleDetail, createArticle, updateArticle } from '../../api/article'
import { getCategories, createCategory } from '../../api/category'
import { generateSlug } from '../../utils/slug'
import { getTags } from '../../api/tag'
import { uploadGenericFile, openLocalFolder, importLocalImagesDirect } from '../../api/file'
import { downloadArticleAsMarkdown } from '../../utils/markdownExport'
import { UploadFilled, RefreshRight, Close, Document, Check, WarningFilled, Picture, FolderOpened } from '@element-plus/icons-vue'
import { useBatchUpload, runBatchUpload, formatFileSize } from '../../utils/batchUpload'
import { parseMarkdownArticle, extractUnresolvedLocalImages, isRemoteOrUploadedUrl } from '../../utils/markdownParser'
import { getAllFilesFromDataTransfer } from '../../utils/dragDrop'
import MarkdownEditor from '../../components/MarkdownEditor.vue'
import CoverUpload from '../../components/CoverUpload.vue'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const mdFileInput = ref<HTMLInputElement | null>(null)
const imgFileInput = ref<HTMLInputElement | null>(null)
const showDragDropModal = ref(false)
const isDragOver = ref(false)

const currentMdContent = ref('')
const currentFilename = ref('')
const parsedMetadata = ref<any>({})
const mdImages = ref<Array<{ rawPath: string; filename: string; uploadedUrl: string | null }>>([])
const detectedLocalFolderPath = ref('')

async function handleOpenFolder() {
  if (!detectedLocalFolderPath.value) return
  try {
    await openLocalFolder(detectedLocalFolderPath.value)
    ElMessage.success('已向系统发起打开文件夹指令')
  } catch {
    ElMessage.info('云端部署模式下无法自动打开本地文件夹，请点击“选择本地图片文件”或拖拽图片文件上传')
  }
}

function triggerMdSelect() {
  mdFileInput.value?.click()
}

function triggerImgSelect() {
  imgFileInput.value?.click()
}

function handleImageFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (files.length > 0) {
    processImageFiles(files)
  }
  target.value = ''
}

let pageDragCounter = 0
const isPageMdDragOver = ref(false)

function handlePageDragEnter(e: DragEvent) {
  if (e.dataTransfer?.types?.includes('Files')) {
    pageDragCounter++
    isPageMdDragOver.value = true
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
    isPageMdDragOver.value = false
  }
}

async function handlePageDrop(e: DragEvent) {
  pageDragCounter = 0
  isPageMdDragOver.value = false
  if (!e.dataTransfer) return
  const files = await getAllFilesFromDataTransfer(e.dataTransfer)
  const mdFile = files.find((f) => f.name.toLowerCase().endsWith('.md') || f.name.toLowerCase().endsWith('.markdown'))
  if (mdFile) {
    processMdFile(mdFile)
  }
}

async function handleButtonMdDrop(e: DragEvent) {
  if (!e.dataTransfer) return
  const files = await getAllFilesFromDataTransfer(e.dataTransfer)
  const mdFile = files.find((f) => f.name.toLowerCase().endsWith('.md') || f.name.toLowerCase().endsWith('.markdown'))
  if (mdFile) {
    processMdFile(mdFile)
  }
}

function handleMdFileLoad(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processMdFile(file)
  }
  target.value = ''
}

function processDroppedMdFile(file: File) {
  processMdFile(file)
}

function processMdFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.md') && !file.name.toLowerCase().endsWith('.markdown')) {
    ElMessage.error('请选择 .md 格式的 Markdown 文档！')
    return
  }

  isImportedFromLocalMd.value = true
  const rawBaseName = file.name.substring(0, file.name.lastIndexOf('.'))
  currentFilename.value = rawBaseName

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = (e.target?.result as string) || ''
    const parsed = parseMarkdownArticle(text, rawBaseName)
    parsedMetadata.value = parsed
    currentMdContent.value = parsed.content

    extractLocalImages(currentMdContent.value)

    if (mdImages.value.length > 0) {
      showDragDropModal.value = true
    } else {
      fillFormAndFinish()
    }
  }
  reader.readAsText(file)
}

function handleSummaryDrop(e: DragEvent) {
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      e.preventDefault()
      const reader = new FileReader()
      reader.onload = (ev) => {
        form.value.summary = (ev.target?.result as string).slice(0, 300).trim()
      }
      reader.readAsText(file)
    }
  }
}

const unresolvedLocalImages = computed(() => {
  return extractUnresolvedLocalImages(form.value.content || '')
})

const unresolvedImagesCount = computed(() => unresolvedLocalImages.value.length)

const isDirectImporting = ref(false)
const folderFileInputRef = ref<HTMLInputElement | null>(null)

function openImageSupplementModal() {
  extractLocalImages(form.value.content || '')
  if (mdImages.value.length === 0) {
    ElMessage.info('当前正文中未检测到本地图片链接或所有图片已为在线链接！')
    return
  }
  showDragDropModal.value = true
}

function triggerFolderSelect() {
  folderFileInputRef.value?.click()
}

async function handleFolderFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (files.length > 0) {
    await processImageFiles(files)
  }
  target.value = ''
}

async function handleDirectLocalImport() {
  if (!detectedLocalFolderPath.value && !mdImages.value.some(i => /^[a-zA-Z]:[\\\/]/.test(i.rawPath))) {
    ElMessage.warning('请输入或提供图片所在的本地文件夹路径')
    return
  }

  isDirectImporting.value = true
  try {
    const unUploaded = mdImages.value.filter(i => !i.uploadedUrl)
    const res = await importLocalImagesDirect({
      folderPath: detectedLocalFolderPath.value || undefined,
      imagePaths: unUploaded.map(i => i.rawPath)
    })

    let successCount = 0
    res.forEach(item => {
      if (item.success && item.url) {
        const target = mdImages.value.find(i => i.rawPath === item.rawPath || i.filename === item.filename)
        if (target) {
          target.uploadedUrl = item.url
          successCount++
        }
      }
    })

    if (successCount > 0) {
      ElMessage.success(`成功从本地路径读取并转存 ${successCount} 张图片！`)
      replaceUploadedImagesInContent()
      if (mdImages.value.every(i => i.uploadedUrl)) {
        ElMessage.success('所有本地图片均已完成转存与链接替换！')
      }
    } else {
      ElMessage.warning('未在指定本地路径中找到待转存图片，请检查路径是否正确，或点击“选取本地文件夹”进行补充。')
    }
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.status === 404 || err?.message?.includes('404')) {
      ElMessage.error('后端一键本地导入接口未生效（404）。如果您刚在 IDEA 中新增了后端接口，请在 IDEA 中重新运行/重启 Spring Boot 后端项目！')
    } else {
      ElMessage.error(err.message || '从本地路径读取导入失败')
    }
  } finally {
    isDirectImporting.value = false
  }
}

function extractLocalImages(content: string) {
  mdImages.value = []
  const imgRegex = /!\[.*?\]\((.*?)\)/g
  let match
  const uniquePaths = new Set<string>()

  while ((match = imgRegex.exec(content)) !== null) {
    const rawPath = match[1].trim()
    if (isRemoteOrUploadedUrl(rawPath)) {
      continue
    }

    const filename = decodeURIComponent(rawPath.replace(/^.*[\\\/]/, ''))
    if (filename && !uniquePaths.has(rawPath)) {
      uniquePaths.add(rawPath)
      mdImages.value.push({
        rawPath,
        filename,
        uploadedUrl: null
      })
    }

    if (!detectedLocalFolderPath.value) {
      const isAbsoluteWin = /^[a-zA-Z]:[\\\/]/.test(rawPath)
      const isAbsoluteUnix = rawPath.startsWith('/')
      if (isAbsoluteWin || isAbsoluteUnix) {
        const lastSlashIdx = Math.max(rawPath.lastIndexOf('/'), rawPath.lastIndexOf('\\'))
        if (lastSlashIdx > 0) {
          detectedLocalFolderPath.value = rawPath.substring(0, lastSlashIdx)
        }
      }
    }
  }

  const htmlImgRegex = /<img\s+[^>]*src=["'](.*?)["']/gi
  while ((match = htmlImgRegex.exec(content)) !== null) {
    const rawPath = match[1].trim()
    if (isRemoteOrUploadedUrl(rawPath)) {
      continue
    }

    const filename = decodeURIComponent(rawPath.replace(/^.*[\\\/]/, ''))
    if (filename && !uniquePaths.has(rawPath)) {
      uniquePaths.add(rawPath)
      mdImages.value.push({
        rawPath,
        filename,
        uploadedUrl: null
      })
    }
  }
}

async function onDropImages(event: DragEvent) {
  isDragOver.value = false
  if (!event.dataTransfer) return
  const files = await getAllFilesFromDataTransfer(event.dataTransfer)
  if (files.length > 0) {
    await processImageFiles(files)
  }
}

async function processImageFiles(files: File[]) {
  if (files.length === 0) return

  // 筛选出属于待转存列表的文件（支持中文解码与大小写不敏感匹配）
  const targetFiles = files.filter((file) =>
    mdImages.value.some((img) => {
      if (img.uploadedUrl) return false
      const rawDecoded = decodeURIComponent(img.filename).toLowerCase()
      const fName = file.name.toLowerCase()
      return rawDecoded === fName || img.filename.toLowerCase() === fName
    })
  )

  if (targetFiles.length === 0) {
    ElMessage.info('所选图片不在待转存列表中或已转存完成')
    return
  }

  const loadingMsg = ElMessage.info({
    message: `正在并发转存 ${targetFiles.length} 张图片...`,
    duration: 0
  })

  const { success } = await runBatchUpload(targetFiles, {
    concurrency: 3,
    uploadFn: uploadGenericFile,
    onTaskUpdate: (task) => {
      if (task.status === 'success' && task.result) {
        const targetImg = mdImages.value.find((img) => {
          const rawDecoded = decodeURIComponent(img.filename).toLowerCase()
          const fName = task.file.name.toLowerCase()
          return rawDecoded === fName || img.filename.toLowerCase() === fName
        })
        if (targetImg) {
          targetImg.uploadedUrl = task.result.url
        }
      }
    }
  })
  loadingMsg.close()
  const uploadCount = success.length

  replaceUploadedImagesInContent()

  const allUploaded = mdImages.value.every((img) => img.uploadedUrl !== null)
  if (allUploaded) {
    ElMessage.success('所有图片均已成功上传转存！')
    if (isImportedFromLocalMd.value) {
      showDragDropModal.value = false
      fillFormAndFinish()
    }
  } else {
    try {
      await ElMessageBox.confirm(
        '检测到仍有部分引用的图片未上传转存，是否跳过这些图片并继续？',
        '部分图片未转存',
        {
          confirmButtonText: '确定继续',
          cancelButtonText: '继续选择/拖入图片',
          type: 'warning',
        }
      )
      if (isImportedFromLocalMd.value) {
        showDragDropModal.value = false
        fillFormAndFinish()
      }
    } catch {
      if (uploadCount > 0) {
        ElMessage.info('已转存部分图片，您可以继续选取剩余图片！')
      } else {
        ElMessage.info('您可以继续选择或拖拽上传剩余的图片文件')
      }
    }
  }
}

function replaceUploadedImagesInContent() {
  let content = form.value.content || currentMdContent.value || ''
  mdImages.value.forEach((img) => {
    if (img.uploadedUrl) {
      const escapedPath = img.rawPath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      const regex = new RegExp(escapedPath, 'g')
      content = content.replace(regex, () => img.uploadedUrl!)
    }
  })
  form.value.content = content
  currentMdContent.value = content
}

function finishImageSupplement() {
  replaceUploadedImagesInContent()
  showDragDropModal.value = false
  if (isImportedFromLocalMd.value) {
    fillFormAndFinish()
  } else {
    ElMessage.success('正文图片链接已全部替换更新！')
  }
}

function closeSupplementModal() {
  showDragDropModal.value = false
  if (isImportedFromLocalMd.value && !form.value.title) {
    cancelImport()
  }
}

function handleSupplementModalClosed() {
  if (isImportedFromLocalMd.value && !form.value.title) {
    cancelImport()
  }
}

function replaceImagesAndFill() {
  finishImageSupplement()
}

function fillFormAndFinish() {
  form.value.title = parsedMetadata.value.title || currentFilename.value
  form.value.summary = parsedMetadata.value.summary || ''
  if (parsedMetadata.value.cover) {
    form.value.cover = parsedMetadata.value.cover
  }
  if (parsedMetadata.value.isTop !== undefined) {
    form.value.isTop = parsedMetadata.value.isTop
  }
  if (parsedMetadata.value.status !== undefined) {
    form.value.status = parsedMetadata.value.status
  }
  form.value.content = currentMdContent.value

  if (parsedMetadata.value.category) {
    const matchedCat = categories.value.find(
      (cat) => cat.name.trim().toLowerCase() === parsedMetadata.value.category.trim().toLowerCase()
    )
    if (matchedCat) {
      form.value.categoryId = matchedCat.id
    }
  }

  if (parsedMetadata.value.tags && parsedMetadata.value.tags.length > 0) {
    const matchedTagIds: number[] = []
    parsedMetadata.value.tags.forEach((tagName: string) => {
      const matchedTag = tags.value.find(
        (t) => t.name.trim().toLowerCase() === tagName.trim().toLowerCase()
      )
      if (matchedTag) {
        matchedTagIds.push(matchedTag.id)
      }
    })
    form.value.tagIds = Array.from(new Set([...form.value.tagIds, ...matchedTagIds]))
  }

  ElMessage.success('Markdown 解析导入成功')
}


function cancelImport() {
  showDragDropModal.value = false
  mdImages.value = []
  detectedLocalFolderPath.value = ''
  currentMdContent.value = ''
  currentFilename.value = ''
  parsedMetadata.value = {}
  ElMessage.info('已取消导入')
}

function forceImport() {
  ElMessage.warning('已跳过未上传图片并导入内容')
  replaceImagesAndFill()
}

const form = ref({
  title: '',
  summary: '',
  content: '',
  cover: '',
  categoryId: undefined as number | undefined,
  tagIds: [] as number[],
  isTop: false,
  status: true,
})

interface AttachmentItem {
  url: string
  filename: string
}
const attachments = ref<AttachmentItem[]>([])

const attachmentFileInput = ref<HTMLInputElement | null>(null)
const isAttachmentDragOver = ref(false)

const attachmentBatch = useBatchUpload({
  concurrency: 3,
  uploadFn: uploadGenericFile,
  onTaskSuccess: (task) => {
    if (task.result) {
      const exists = attachments.value.some((a) => a.url === task.result!.url)
      if (!exists) {
        attachments.value.push({
          url: task.result.url,
          filename: task.result.filename || task.name
        })
      }
    }
  }
})

function triggerAttachmentSelect() {
  attachmentFileInput.value?.click()
}

function handleAttachmentFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (files.length > 0) {
    uploadAttachmentFiles(files)
  }
  target.value = ''
}

function onDropAttachments(e: DragEvent) {
  isAttachmentDragOver.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  if (files.length > 0) {
    uploadAttachmentFiles(files)
  }
}

function uploadAttachmentFiles(files: File[]) {
  const validFiles: File[] = []
  for (const f of files) {
    if (f.size / 1024 / 1024 > 10) {
      ElMessage.error(`${f.name} 超出 10MB 大小限制，已跳过`)
    } else {
      validFiles.push(f)
    }
  }
  if (validFiles.length > 0) {
    attachmentBatch.uploadFiles(validFiles)
  }
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text)
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
    } catch (err) {
      console.error('复制失败', err)
    }
    document.body.removeChild(textarea)
  }
}

async function insertAttachmentLink(file: AttachmentItem) {
  const mdLink = `[${file.filename}](${file.url})`
  try {
    await copyToClipboard(mdLink)
    ElMessage.success({
      message: '已成功生成并复制 Markdown 链接！请直接在正文中按 Ctrl+V 粘贴。',
      duration: 5000
    })
  } catch {
    ElMessage.error('复制链接失败，请手动复制')
  }
}

async function copyLink(url: string) {
  const fullUrl = window.location.origin + url
  try {
    await copyToClipboard(fullUrl)
    ElMessage.success('已复制文件链接到剪贴板！')
  } catch {
    ElMessage.error('复制链接失败，请手动复制')
  }
}

function removeAttachment(index: number) {
  attachments.value.splice(index, 1)
  ElMessage.success('附件已移除')
}

const categories = ref<any[]>([])
const showQuickCatDialog = ref(false)
const isQuickCreatingCat = ref(false)
const quickCatForm = ref({ name: '', slug: '', description: '' })

function openQuickCatDialog() {
  quickCatForm.value = { name: '', slug: '', description: '' }
  showQuickCatDialog.value = true
}

function handleQuickCatNameBlur() {
  if (quickCatForm.value.name.trim() && !quickCatForm.value.slug.trim()) {
    quickCatForm.value.slug = generateSlug(quickCatForm.value.name)
  }
}

function generateQuickCatSlug() {
  if (!quickCatForm.value.name.trim()) {
    ElMessage.info('请先输入分类名称')
    return
  }
  quickCatForm.value.slug = generateSlug(quickCatForm.value.name)
}

async function handleQuickCreateCatSubmit() {
  const name = quickCatForm.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入分类名称')
    return
  }

  isQuickCreatingCat.value = true
  try {
    const slug = quickCatForm.value.slug.trim() || generateSlug(name)
    const newCat = await createCategory({
      name,
      slug,
      description: quickCatForm.value.description.trim(),
      sort: 0
    })
    ElMessage.success('分类创建成功并已自动选中！')
    showQuickCatDialog.value = false
    categories.value = await getCategories()
    form.value.categoryId = newCat.id
  } catch (err: any) {
    ElMessage.error(err.message || '快捷创建分类失败')
  } finally {
    isQuickCreatingCat.value = false
  }
}

const tags = ref<any[]>([])
const articleCreateTime = ref('')

async function fetchData() {
  const [cats, t] = await Promise.all([getCategories(), getTags()])
  categories.value = cats
  tags.value = t

  if (isEdit.value) {
    const article = await getAdminArticleDetail(Number(route.params.id))
    articleCreateTime.value = article.createTime || ''
    form.value = {
      title: article.title,
      summary: article.summary || '',
      content: article.content || '',
      cover: article.cover || '',
      categoryId: article.categoryId,
      tagIds: article.tags?.map(t => t.id) || [],
      isTop: article.isTop,
      status: article.status,
    }
  }
}

const DRAFT_KEY = 'BLOG_DRAFT_ARTICLE'
const isImportedFromLocalMd = ref(false)
const isRestoringDraft = ref(false)

watch(
  form,
  (newForm) => {
    if (isEdit.value || isRestoringDraft.value) return
    if (newForm.title || newForm.content || newForm.summary) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(newForm))
    }
  },
  { deep: true }
)

function clearDraftCache() {
  localStorage.removeItem(DRAFT_KEY)
}

function checkAndRestoreDraft() {
  if (isEdit.value) return
  const draftData = localStorage.getItem(DRAFT_KEY)
  if (!draftData) return

  try {
    const parsed = JSON.parse(draftData)
    if (parsed && (parsed.title || parsed.content || parsed.summary)) {
      ElMessageBox.confirm(
        '检测到您上次有未保存的文章草稿，是否要恢复内容？',
        '恢复本地草稿',
        {
          confirmButtonText: '恢复草稿',
          cancelButtonText: '清空草稿',
          type: 'info'
        }
      )
        .then(() => {
          isRestoringDraft.value = true
          form.value = { ...form.value, ...parsed }
          ElMessage.success('已恢复草稿')
          setTimeout(() => {
            isRestoringDraft.value = false
          }, 300)
        })
        .catch(() => {
          clearDraftCache()
          ElMessage.info('已清空草稿')
        })
    }
  } catch {
    clearDraftCache()
  }
}

async function exportCurrentMd() {
  if (!form.value.content) {
    ElMessage.warning('内容为空，无法导出')
    return
  }

  const categoryName = categories.value.find((c) => c.id === form.value.categoryId)?.name
  const tagNames = tags.value.filter((t) => form.value.tagIds.includes(t.id)).map((t) => t.name)

  const loadingMsg = ElMessage.info({
    message: '正在导出 ZIP 压缩包...',
    duration: 0
  })

  try {
    await downloadArticleAsMarkdown({
      title: form.value.title,
      content: form.value.content,
      summary: form.value.summary,
      cover: form.value.cover,
      categoryName,
      tagNames,
      date: articleCreateTime.value || undefined,
    })
    loadingMsg.close()
    ElMessage.success('文章导出成功')
  } catch {
    loadingMsg.close()
    ElMessage.error('导出失败')
  }
}

async function handleSubmit() {
  try {
    if (isEdit.value) {
      await updateArticle(Number(route.params.id), form.value)
      ElMessage.success('保存成功')
      clearDraftCache()
    } else {
      const res = await createArticle(form.value)
      ElMessage.success('创建成功')

      // 若非从本地 .md 文件直接导入（手写或直接粘贴正文），发布时自动弹出本地 .md 文件下载留档
      if (!isImportedFromLocalMd.value && form.value.content) {
        const categoryName = categories.value.find((c) => c.id === form.value.categoryId)?.name
        const tagNames = tags.value.filter((t) => form.value.tagIds.includes(t.id)).map((t) => t.name)

        await downloadArticleAsMarkdown({
          title: form.value.title,
          content: form.value.content,
          summary: form.value.summary,
          cover: form.value.cover,
          categoryName,
          tagNames,
          date: new Date().toISOString(),
        })
        ElMessage.success('已导出 Markdown 留档包')
      }

      clearDraftCache()
      router.push(`/admin/articles/${res.id}/edit`)
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

onMounted(async () => {
  await fetchData()
  checkAndRestoreDraft()
  if (route.query.from === 'import') {
    ElMessage.info('已导入元数据，请核对后保存')
  }
  if (route.query.import === 'md') {
    setTimeout(() => {
      triggerMdSelect()
    }, 300)
  }
  if (route.query.supplement === 'img') {
    setTimeout(() => {
      openImageSupplementModal()
    }, 400)
  }
})
</script>
