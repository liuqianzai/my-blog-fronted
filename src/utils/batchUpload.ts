import type { UploadResult } from '../api/file'

export type TaskStatus = 'pending' | 'uploading' | 'success' | 'error'

export interface BatchUploadTask {
  id: string
  file: File
  name: string
  size: number
  status: TaskStatus
  progress: number
  result?: UploadResult
  error?: string
}

export interface BatchUploadOptions {
  /**
   * 最大并发数量，默认 3
   */
  concurrency?: number
  /**
   * 单文件执行上传的异步函数
   */
  uploadFn: (file: File, onProgress: (percent: number) => void) => Promise<UploadResult>
  /**
   * 单个任务状态或进度变动时的回调
   */
  onTaskUpdate?: (task: BatchUploadTask) => void
  /**
   * 总体进度变动回调 (0 - 100)
   */
  onOverallProgress?: (percent: number, completedCount: number, totalCount: number) => void
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * 创建并管理并发上传队列的控制器
 */
export class BatchUploadQueue {
  private concurrency: number
  private uploadFn: (file: File, onProgress: (percent: number) => void) => Promise<UploadResult>
  private onTaskUpdate?: (task: BatchUploadTask) => void
  private onOverallProgress?: (percent: number, completedCount: number, totalCount: number) => void

  public tasks: BatchUploadTask[] = []
  private activeCount = 0
  private isProcessing = false
  private resolveAllPromise?: (tasks: BatchUploadTask[]) => void

  constructor(options: BatchUploadOptions) {
    this.concurrency = options.concurrency || 3
    this.uploadFn = options.uploadFn
    this.onTaskUpdate = options.onTaskUpdate
    this.onOverallProgress = options.onOverallProgress
  }

  /**
   * 添加一批文件到队列中
   */
  public addFiles(files: File[]): BatchUploadTask[] {
    const newTasks: BatchUploadTask[] = files.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${file.name}`,
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
    }))

    this.tasks.push(...newTasks)
    newTasks.forEach((t) => this.onTaskUpdate?.(t))
    this.calcOverallProgress()
    return newTasks
  }

  /**
   * 开始执行队列，返回全部任务结束后的 Promise
   */
  public start(): Promise<BatchUploadTask[]> {
    return new Promise((resolve) => {
      this.resolveAllPromise = resolve
      this.isProcessing = true
      this.schedule()
    })
  }

  /**
   * 重试单个失败的任务
   */
  public retryTask(taskId: string): void {
    const task = this.tasks.find((t) => t.id === taskId)
    if (!task || task.status === 'uploading') return

    task.status = 'pending'
    task.progress = 0
    task.error = undefined
    this.onTaskUpdate?.(task)
    this.calcOverallProgress()

    this.schedule()
  }

  /**
   * 重试所有失败的任务
   */
  public retryAllFailed(): void {
    const failedTasks = this.tasks.filter((t) => t.status === 'error')
    failedTasks.forEach((task) => {
      task.status = 'pending'
      task.progress = 0
      task.error = undefined
      this.onTaskUpdate?.(task)
    })
    this.calcOverallProgress()
    this.schedule()
  }

  /**
   * 移除指定任务（若正在上传不会取消网络请求，但移出队列）
   */
  public removeTask(taskId: string): void {
    const index = this.tasks.findIndex((t) => t.id === taskId)
    if (index !== -1) {
      this.tasks.splice(index, 1)
      this.calcOverallProgress()
      this.schedule()
    }
  }

  /**
   * 清空已完成或出错的任务
   */
  public clearDoneTasks(): void {
    this.tasks = this.tasks.filter((t) => t.status === 'pending' || t.status === 'uploading')
    this.calcOverallProgress()
  }

  /**
   * 核心调度循环：保持并发量维持在 concurrency
   */
  private schedule(): void {
    while (this.activeCount < this.concurrency) {
      const nextTask = this.tasks.find((t) => t.status === 'pending')
      if (!nextTask) break

      this.executeTask(nextTask)
    }

    // 检查是否所有任务都已到达终态 (success 或 error)
    const hasRemaining = this.tasks.some(
      (t) => t.status === 'pending' || t.status === 'uploading'
    )
    if (!hasRemaining && this.activeCount === 0 && this.isProcessing) {
      this.isProcessing = false
      if (this.resolveAllPromise) {
        this.resolveAllPromise(this.tasks)
      }
    }
  }

  /**
   * 执行单个上传任务
   */
  private async executeTask(task: BatchUploadTask): Promise<void> {
    this.activeCount++
    task.status = 'uploading'
    task.progress = 0
    this.onTaskUpdate?.(task)
    this.calcOverallProgress()

    try {
      const result = await this.uploadFn(task.file, (percent) => {
        task.progress = percent
        this.onTaskUpdate?.(task)
        this.calcOverallProgress()
      })

      task.status = 'success'
      task.progress = 100
      task.result = result
      this.onTaskUpdate?.(task)
    } catch (err: any) {
      task.status = 'error'
      task.error = err?.message || '上传失败'
      this.onTaskUpdate?.(task)
    } finally {
      this.activeCount--
      this.calcOverallProgress()
      this.schedule()
    }
  }

  /**
   * 计算总体完成进度
   */
  private calcOverallProgress(): void {
    const totalCount = this.tasks.length
    if (totalCount === 0) {
      this.onOverallProgress?.(0, 0, 0)
      return
    }

    const completedCount = this.tasks.filter(
      (t) => t.status === 'success' || t.status === 'error'
    ).length

    // 总进度加权：根据每个任务自身的 progress 计算均值
    const totalProgressSum = this.tasks.reduce((sum, t) => sum + (t.progress || 0), 0)
    const overallPercent = Math.min(100, Math.round(totalProgressSum / totalCount))

    this.onOverallProgress?.(overallPercent, completedCount, totalCount)
  }
}

/**
 * 快捷函数：直接执行一次并发上传并返回结果汇总
 */
export async function runBatchUpload(
  files: File[],
  options: BatchUploadOptions
): Promise<{
  all: BatchUploadTask[]
  success: BatchUploadTask[]
  failed: BatchUploadTask[]
}> {
  const queue = new BatchUploadQueue(options)
  queue.addFiles(files)
  const all = await queue.start()

  return {
    all,
    success: all.filter((t) => t.status === 'success'),
    failed: all.filter((t) => t.status === 'error'),
  }
}

import { ref, computed } from 'vue'

/**
 * 方便在 Vue 组件中直接使用的响应式批量上传 hook
 */
export function useBatchUpload(options: {
  concurrency?: number
  uploadFn: (file: File, onProgress: (percent: number) => void) => Promise<UploadResult>
  onTaskSuccess?: (task: BatchUploadTask) => void
  onTaskError?: (task: BatchUploadTask) => void
}) {
  const tasks = ref<BatchUploadTask[]>([])
  const isUploading = ref(false)
  const overallPercent = ref(0)
  const completedCount = ref(0)
  const totalCount = ref(0)

  const queue = new BatchUploadQueue({
    concurrency: options.concurrency || 3,
    uploadFn: options.uploadFn,
    onTaskUpdate: (task) => {
      const idx = tasks.value.findIndex((t) => t.id === task.id)
      if (idx !== -1) {
        tasks.value[idx] = { ...task }
      } else {
        tasks.value.push({ ...task })
      }

      if (task.status === 'success') {
        options.onTaskSuccess?.(task)
      } else if (task.status === 'error') {
        options.onTaskError?.(task)
      }
    },
    onOverallProgress: (percent, comp, tot) => {
      overallPercent.value = percent
      completedCount.value = comp
      totalCount.value = tot
      isUploading.value = comp < tot
    },
  })

  const uploadFiles = async (files: File[]) => {
    queue.addFiles(files)
    tasks.value = [...queue.tasks]
    return await queue.start()
  }

  const retryTask = (taskId: string) => {
    queue.retryTask(taskId)
  }

  const retryAllFailed = () => {
    queue.retryAllFailed()
  }

  const removeTask = (taskId: string) => {
    queue.removeTask(taskId)
    tasks.value = [...queue.tasks]
  }

  const clearDoneTasks = () => {
    queue.clearDoneTasks()
    tasks.value = [...queue.tasks]
  }

  const hasFailed = computed(() => tasks.value.some((t) => t.status === 'error'))
  const successCount = computed(() => tasks.value.filter((t) => t.status === 'success').length)
  const failedCount = computed(() => tasks.value.filter((t) => t.status === 'error').length)

  return {
    tasks,
    isUploading,
    overallPercent,
    completedCount,
    totalCount,
    hasFailed,
    successCount,
    failedCount,
    uploadFiles,
    retryTask,
    retryAllFailed,
    removeTask,
    clearDoneTasks,
  }
}

