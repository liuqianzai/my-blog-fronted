import JSZip from 'jszip'
import { parseMarkdownArticle } from './markdownParser'
import { uploadImage, uploadGenericFile } from '../api/file'
import { runBatchUpload } from './batchUpload'
import { createCategory, type Category } from '../api/category'
import { createTag, type Tag } from '../api/tag'
import { generateSlug } from './slug'

export interface RestoredArticleData {
  title: string
  summary: string
  content: string
  cover: string
  categoryId?: number
  tagIds: number[]
  attachments: Array<{ filename: string; url: string }>
  imagesCount: number
  attachmentsCount: number
}

export interface RestoreArticleOptions {
  categories?: Category[]
  tags?: Tag[]
  onCategoryCreated?: (newCategory: Category) => void
  onTagCreated?: (newTag: Tag) => void
  onProgress?: (message: string) => void
}

/**
 * 常见图片扩展名
 */
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico']

/**
 * 根据扩展名获取图片 MIME 类型
 */
function getImageMimeType(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'svg':
      return 'image/svg+xml'
    case 'bmp':
      return 'image/bmp'
    case 'ico':
      return 'image/x-icon'
    default:
      return 'image/png'
  }
}

/**
 * 判断一个 ZIP 文件是否为包含 Markdown 文档的文章留档包
 */
export async function isArticleZip(file: File): Promise<boolean> {
  if (!file.name.toLowerCase().endsWith('.zip')) return false
  try {
    const zip = await JSZip.loadAsync(file)
    const md = Object.keys(zip.files).find((name) => {
      if (name.includes('__MACOSX') || name.startsWith('.') || name.includes('/.')) return false
      return (
        !zip.files[name].dir &&
        (name.toLowerCase().endsWith('.md') || name.toLowerCase().endsWith('.markdown'))
      )
    })
    return !!md
  } catch {
    return false
  }
}

/**
 * 从导出的 ZIP 留档压缩包中自动解压并恢复文章数据，转存图片与附件并完成相对路径在线化替换
 */
export async function restoreArticleFromZip(
  zipFile: File,
  options?: RestoreArticleOptions
): Promise<RestoredArticleData> {
  options?.onProgress?.('正在读取并解压 ZIP 留档包...')
  const zip = await JSZip.loadAsync(zipFile)
  const allFiles = Object.keys(zip.files)

  // 1. 查找 ZIP 中的 Markdown 文档
  const mdFileNames = allFiles.filter((name) => {
    if (name.includes('__MACOSX') || name.startsWith('.') || name.includes('/.')) return false
    const entry = zip.files[name]
    if (entry.dir) return false
    const lower = name.toLowerCase()
    return lower.endsWith('.md') || lower.endsWith('.markdown')
  })

  if (mdFileNames.length === 0) {
    throw new Error('ZIP 压缩包中未检测到任何 .md 格式的 Markdown 文章文件！')
  }

  // 优先选取根目录下或层级最浅的 .md 文件
  mdFileNames.sort((a, b) => a.split('/').length - b.split('/').length)
  const mdFileName = mdFileNames[0]
  const mdEntry = zip.files[mdFileName]
  const mdRawText = await mdEntry.async('string')

  // 2. 解析 Markdown 文本与元数据
  const baseName =
    mdFileName.split('/').pop()?.replace(/\.(md|markdown)$/i, '') ||
    zipFile.name.replace(/\.zip$/i, '')
  const parsed = parseMarkdownArticle(mdRawText, baseName)

  // 清洗标题中的留档时间前缀（如 20261016+文章标题 或 2026-10-16_文章标题）
  let title = parsed.title || baseName
  title = title.replace(/^\d{4}[-_/]?\d{2}[-_/]?\d{2}[+\-_ ]+/, '').trim()

  // 3. 收集压缩包中的所有图片资源
  const imageEntries = allFiles.filter((name) => {
    if (name.includes('__MACOSX') || name.startsWith('.') || name.includes('/.')) return false
    const entry = zip.files[name]
    if (entry.dir) return false
    const lower = name.toLowerCase()
    return lower.includes('images/') || IMAGE_EXTS.some((ext) => lower.endsWith(ext))
  })

  // 4. 收集压缩包中的所有附件资源
  const attachmentEntries = allFiles.filter((name) => {
    if (name.includes('__MACOSX') || name.startsWith('.') || name.includes('/.')) return false
    const entry = zip.files[name]
    if (entry.dir) return false
    if (name === mdFileName || imageEntries.includes(name)) return false
    const lower = name.toLowerCase()
    return lower.includes('attachments/')
  })

  // 5. 将图片转为 File 对象
  const imageFiles: Array<{
    cleanFilename: string
    file: File
    isCover: boolean
  }> = []

  for (const entryName of imageEntries) {
    const entry = zip.files[entryName]
    const blob = await entry.async('blob')
    const cleanFilename = entryName.split('/').pop() || 'image.png'
    const ext = cleanFilename.split('.').pop()?.toLowerCase() || 'png'
    const mime = getImageMimeType(ext)
    const file = new File([blob], cleanFilename, { type: mime })

    const isCover =
      cleanFilename.toLowerCase().startsWith('cover.') ||
      (parsed.cover ? parsed.cover.includes(cleanFilename) : false)

    imageFiles.push({ cleanFilename, file, isCover })
  }

  // 6. 将附件转为 File 对象
  const attachmentFiles: Array<{
    cleanFilename: string
    file: File
  }> = []

  for (const entryName of attachmentEntries) {
    const entry = zip.files[entryName]
    const blob = await entry.async('blob')
    const cleanFilename = entryName.split('/').pop() || 'attachment'
    const file = new File([blob], cleanFilename)
    attachmentFiles.push({ cleanFilename, file })
  }

  // 7. 并发上传图片并记录 URL 映射
  const imageReplacementMap = new Map<string, string>()
  let uploadedCoverUrl = ''

  if (imageFiles.length > 0) {
    options?.onProgress?.(`正在转存图片资源 (${imageFiles.length} 张)...`)
    const { success } = await runBatchUpload(
      imageFiles.map((i) => i.file),
      {
        concurrency: 3,
        uploadFn: uploadImage,
      }
    )

    for (const task of success) {
      if (task.result?.url) {
        const matchingItem = imageFiles.find((i) => i.file === task.file)
        if (matchingItem) {
          const url = task.result.url
          imageReplacementMap.set(matchingItem.cleanFilename, url)
          imageReplacementMap.set(`./images/${matchingItem.cleanFilename}`, url)
          imageReplacementMap.set(`images/${matchingItem.cleanFilename}`, url)

          if (matchingItem.isCover) {
            uploadedCoverUrl = url
          }
        }
      }
    }
  }

  // 8. 并发上传附件并记录 URL 映射
  const attachmentReplacementMap = new Map<string, string>()
  const restoredAttachments: Array<{ filename: string; url: string }> = []

  if (attachmentFiles.length > 0) {
    options?.onProgress?.(`正在转存附件资源 (${attachmentFiles.length} 个)...`)
    const { success } = await runBatchUpload(
      attachmentFiles.map((a) => a.file),
      {
        concurrency: 3,
        uploadFn: uploadGenericFile,
      }
    )

    for (const task of success) {
      if (task.result?.url) {
        const matchingItem = attachmentFiles.find((a) => a.file === task.file)
        if (matchingItem) {
          const url = task.result.url
          const finalFilename = task.result.filename || matchingItem.cleanFilename

          attachmentReplacementMap.set(matchingItem.cleanFilename, url)
          attachmentReplacementMap.set(`./attachments/${matchingItem.cleanFilename}`, url)
          attachmentReplacementMap.set(`attachments/${matchingItem.cleanFilename}`, url)

          restoredAttachments.push({
            filename: finalFilename,
            url,
          })
        }
      }
    }
  }

  // 9. 正文链接替换
  let content = parsed.content || ''

  // 替换图片引用路径为已转存的在线地址
  imageReplacementMap.forEach((onlineUrl, localPath) => {
    const escaped = localPath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    content = content.replace(new RegExp(escaped, 'g'), onlineUrl)
  })

  // 替换附件引用路径为已转存的在线地址
  attachmentReplacementMap.forEach((onlineUrl, localPath) => {
    const escaped = localPath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    content = content.replace(new RegExp(escaped, 'g'), onlineUrl)
  })

  // 10. 确定文章封面图
  let finalCover = ''
  if (uploadedCoverUrl) {
    finalCover = uploadedCoverUrl
  } else if (parsed.cover) {
    const cleanCoverPath = parsed.cover.trim()
    const coverFilename = cleanCoverPath.split('/').pop() || ''
    if (imageReplacementMap.has(coverFilename)) {
      finalCover = imageReplacementMap.get(coverFilename)!
    } else if (cleanCoverPath.startsWith('http://') || cleanCoverPath.startsWith('https://') || cleanCoverPath.startsWith('/api/')) {
      finalCover = cleanCoverPath
    }
  }

  // 移除正文首行为了本地预览而追加的 ![封面图](...) 标记（避免详情页出现重复封面图）
  if (finalCover) {
    content = content.replace(/^!\[封面图\]\(.*?\)\r?\n\r?\n?/, '')
  }

  // 11. 分类匹配与快捷新建
  let categoryId: number | undefined
  if (parsed.category) {
    const catName = parsed.category.trim()
    const existingCat = options?.categories?.find(
      (c) => c.name.toLowerCase() === catName.toLowerCase()
    )
    if (existingCat) {
      categoryId = existingCat.id
    } else {
      try {
        const newCat = await createCategory({
          name: catName,
          slug: generateSlug(catName),
        })
        categoryId = newCat.id
        options?.onCategoryCreated?.(newCat)
      } catch (err) {
        console.warn('[Restore] 快捷新建分类失败:', err)
      }
    }
  }

  // 12. 标签匹配与快捷新建
  const tagIds: number[] = []
  if (parsed.tags && parsed.tags.length > 0) {
    for (const tagName of parsed.tags) {
      const cleanTagName = tagName.trim()
      if (!cleanTagName) continue

      const existingTag = options?.tags?.find(
        (t) => t.name.toLowerCase() === cleanTagName.toLowerCase()
      )
      if (existingTag) {
        tagIds.push(existingTag.id)
      } else {
        try {
          const newTag = await createTag({ name: cleanTagName })
          tagIds.push(newTag.id)
          options?.onTagCreated?.(newTag)
        } catch (err) {
          console.warn('[Restore] 快捷新建标签失败:', err)
        }
      }
    }
  }

  return {
    title,
    summary: parsed.summary || '',
    content,
    cover: finalCover,
    categoryId,
    tagIds,
    attachments: restoredAttachments,
    imagesCount: imageFiles.length,
    attachmentsCount: attachmentFiles.length,
  }
}
