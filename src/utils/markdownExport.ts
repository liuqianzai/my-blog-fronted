import axios from 'axios'
import JSZip from 'jszip'
import { extractAllImageReferences } from './markdownParser'

export interface AttachmentItemParam {
  filename?: string
  url: string
}

export interface ExportMarkdownParams {
  title: string
  content: string
  summary?: string
  cover?: string
  categoryName?: string
  tagNames?: string[]
  date?: string
  attachments?: AttachmentItemParam[]
}

async function fetchImageBlob(url: string): Promise<{ blob: Blob; ext: string } | null> {
  if (!url) return null
  const cleanUrl = url.trim().split(/\s+/)[0]
  if (!cleanUrl) return null

  // 1. 如果是 Base64 Data URL
  if (cleanUrl.startsWith('data:')) {
    try {
      const mimeMatch = cleanUrl.match(/^data:(image\/\w+);base64,/)
      const ext = mimeMatch ? mimeMatch[1].split('/')[1] : 'png'
      const base64Response = await fetch(cleanUrl)
      const blob = await base64Response.blob()
      return { blob, ext }
    } catch {
      return null
    }
  }

  // 2. 优先使用 Axios 获取 Blob (支持通过 Vite 代理 /api 请求以及 Authorization Token 鉴权)
  try {
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await axios.get(cleanUrl, {
      responseType: 'blob',
      headers,
      validateStatus: (status) => status < 400,
    })

    const blob = response.data as Blob
    let ext = 'png'
    const contentType = String(response.headers['content-type'] || blob.type || '')
    if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg'
    else if (contentType.includes('png')) ext = 'png'
    else if (contentType.includes('gif')) ext = 'gif'
    else if (contentType.includes('webp')) ext = 'webp'
    else if (contentType.includes('svg')) ext = 'svg'
    else {
      const matchExt = cleanUrl.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i)
      if (matchExt) ext = matchExt[1].toLowerCase()
    }
    return { blob, ext }
  } catch (err) {
    console.warn(`[MarkdownExport] Axios 抓取图片失败 (${cleanUrl}):`, err)
  }

  // 3. 备用降级方案：使用原生 HTML Image + Canvas 抓取
  try {
    const absoluteUrl = cleanUrl.startsWith('/') ? window.location.origin + cleanUrl : cleanUrl
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || 500
        canvas.height = img.naturalHeight || 300
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          canvas.toBlob((blob) => {
            if (blob) {
              resolve({ blob, ext: 'png' })
            } else {
              resolve(null)
            }
          }, 'image/png')
        } else {
          resolve(null)
        }
      }
      img.onerror = () => resolve(null)
      img.src = absoluteUrl
    })
  } catch {
    return null
  }
}

/**
 * 常见附件文件扩展名正则
 */
const ATTACHMENT_EXT_REGEX =
  /\.(pdf|zip|rar|7z|tar|gz|bz2|xz|doc|docx|xls|xlsx|ppt|pptx|txt|csv|epub|mobi|rtf|mp3|mp4|wav|ogg|flac|avi|mov|mkv|webm|apk|ipa|dmg|pkg|exe|msi|iso|torrent|json|xml|yaml|yml|sql)(\?.*)?$/i

/**
 * 判断指定链接是否为附件文件
 */
export function isAttachmentUrl(url: string, linkText = '', explicitUrls?: Set<string>): boolean {
  if (!url) return false
  const cleanUrl = url.trim().split(/\s+/)[0]
  if (!cleanUrl || cleanUrl.startsWith('#') || cleanUrl.startsWith('mailto:') || cleanUrl.startsWith('javascript:')) {
    return false
  }

  // 1. 如果在显式传入的附件列表中
  if (explicitUrls && (explicitUrls.has(cleanUrl) || explicitUrls.has(url.trim()))) {
    return true
  }

  // 2. 如果是后端上传文件路径
  if (
    cleanUrl.startsWith('/api/files/') ||
    cleanUrl.startsWith('/files/') ||
    cleanUrl.startsWith('/uploads/') ||
    cleanUrl.includes('/api/files/') ||
    cleanUrl.includes('/files/download')
  ) {
    // 排除纯图片路径，例如 /api/files/images/xxx.png
    const isImageFile = /\.(png|jpe?g|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(cleanUrl)
    if (!isImageFile) {
      return true
    }
  }

  // 3. 检查 URL 是否以常见附件扩展名结尾
  if (ATTACHMENT_EXT_REGEX.test(cleanUrl)) {
    return true
  }

  // 4. 检查链接显示文字是否以常见附件扩展名结尾（例如 [技术白皮书.pdf](http://...)）
  if (linkText && ATTACHMENT_EXT_REGEX.test(linkText.trim())) {
    return true
  }

  return false
}

/**
 * 从 Markdown 正文中提取所有的附件链接
 */
export function extractAttachmentsFromContent(
  content: string,
  imageUrls?: Set<string>
): Array<{ url: string; linkText?: string }> {
  if (!content) return []
  const list: Array<{ url: string; linkText?: string }> = []
  const seenUrls = new Set<string>()

  // 1. Markdown 链接语法：[text](url)
  const linkRegex = /(!)?\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g
  let linkMatch: RegExpExecArray | null
  while ((linkMatch = linkRegex.exec(content)) !== null) {
    const isImage = linkMatch[1] === '!'
    if (isImage) continue

    const linkText = linkMatch[2]
    const rawUrl = linkMatch[3]
    if (!rawUrl) continue
    const cleanUrl = rawUrl.trim().split(/\s+/)[0]
    if (!cleanUrl || seenUrls.has(cleanUrl)) continue
    if (imageUrls && imageUrls.has(cleanUrl)) continue

    if (isAttachmentUrl(cleanUrl, linkText)) {
      seenUrls.add(cleanUrl)
      list.push({ url: cleanUrl, linkText })
    }
  }

  // 2. HTML <a> 标签语法：<a href="...">text</a>
  const htmlLinkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi
  let htmlMatch: RegExpExecArray | null
  while ((htmlMatch = htmlLinkRegex.exec(content)) !== null) {
    const rawUrl = htmlMatch[1]
    const linkText = htmlMatch[2]?.replace(/<[^>]+>/g, '').trim()
    if (!rawUrl) continue
    const cleanUrl = rawUrl.trim().split(/\s+/)[0]
    if (!cleanUrl || seenUrls.has(cleanUrl)) continue
    if (imageUrls && imageUrls.has(cleanUrl)) continue

    if (isAttachmentUrl(cleanUrl, linkText)) {
      seenUrls.add(cleanUrl)
      list.push({ url: cleanUrl, linkText })
    }
  }

  return list
}

/**
 * 抓取通用附件文件的二进制 Blob，并尝试获取真实文件名
 */
async function fetchFileBlob(
  url: string
): Promise<{ blob: Blob; headerFilename?: string; ext?: string } | null> {
  if (!url) return null
  const cleanUrl = url.trim().split(/\s+/)[0]
  if (!cleanUrl) return null

  // 1. 如果是 Base64 Data URL
  if (cleanUrl.startsWith('data:')) {
    try {
      const mimeMatch = cleanUrl.match(/^data:([^;]+);base64,/)
      const mime = mimeMatch ? mimeMatch[1] : ''
      const ext = mime ? mime.split('/')[1] : 'bin'
      const base64Response = await fetch(cleanUrl)
      const blob = await base64Response.blob()
      return { blob, ext }
    } catch {
      return null
    }
  }

  // 2. 优先使用 Axios 获取 Blob (支持携带 Authorization Token)
  try {
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await axios.get(cleanUrl, {
      responseType: 'blob',
      headers,
      validateStatus: (status) => status < 400,
    })

    const blob = response.data as Blob

    // 尝试从 Content-Disposition 响应头中解析原始文件名
    let headerFilename: string | undefined
    const disposition = (response.headers && response.headers['content-disposition']) || ''
    if (disposition) {
      const utf8Match = disposition.match(/filename\*=(?:UTF-8|utf-8)''([^;]+)/i)
      if (utf8Match && utf8Match[1]) {
        try {
          headerFilename = decodeURIComponent(utf8Match[1].trim())
        } catch {
          headerFilename = utf8Match[1].trim()
        }
      } else {
        const quotedMatch = disposition.match(/filename="?([^";]+)"?/i)
        if (quotedMatch && quotedMatch[1]) {
          try {
            headerFilename = decodeURIComponent(quotedMatch[1].trim())
          } catch {
            headerFilename = quotedMatch[1].trim()
          }
        }
      }
    }

    let ext: string | undefined
    if (headerFilename && headerFilename.includes('.')) {
      ext = headerFilename.split('.').pop()?.toLowerCase()
    }

    if (!ext) {
      const matchExt = cleanUrl.match(/\.([a-zA-Z0-9]+)(\?.*)?$/)
      if (matchExt) ext = matchExt[1].toLowerCase()
    }

    return { blob, headerFilename, ext }
  } catch (err) {
    console.warn(`[MarkdownExport] 抓取附件失败 (${cleanUrl}):`, err)
    return null
  }
}

/**
 * 确定附件在 ZIP 压缩包中的存放文件名（防重名与特殊字符清洗）
 */
function resolveAttachmentFilename(
  url: string,
  linkText: string | undefined,
  metaFilename: string | undefined,
  headerFilename: string | undefined,
  ext: string | undefined,
  usedFilenames: Set<string>
): string {
  let name = ''

  // 1. 优先使用显式元数据里的 filename（用户上传时的原文件名）
  if (metaFilename && metaFilename.trim()) {
    name = metaFilename.trim()
  }
  // 2. 其次使用 HTTP 响应头中的 Content-Disposition 文件名
  else if (headerFilename && headerFilename.trim()) {
    name = headerFilename.trim()
  }
  // 3. 再次使用 Markdown 链接文字（若包含文件后缀）
  else if (linkText && /\.[a-zA-Z0-9]{1,8}$/.test(linkText.trim())) {
    name = linkText.trim()
  }
  // 4. 从 URL 路径截取文件名
  else {
    const cleanUrl = url.split(/[?#]/)[0]
    const segment = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1)
    if (segment && /\.[a-zA-Z0-9]{1,8}$/.test(segment)) {
      try {
        name = decodeURIComponent(segment)
      } catch {
        name = segment
      }
    } else if (linkText && linkText.trim()) {
      name = linkText.trim()
    } else {
      name = 'attachment'
    }
  }

  // 清洗文件名中的非法特殊字符
  name = name.replace(/[\\/:*?"<>|]/g, '_').trim()
  if (!name) name = 'attachment'

  // 如果没有扩展名，尝试根据推断扩展名补充
  if (!name.includes('.') && ext) {
    name = `${name}.${ext}`
  }

  // 防止同名文件覆盖冲突（追加 _2, _3 等计数后缀）
  let finalName = name
  let counter = 2
  const dotIndex = name.lastIndexOf('.')
  const base = dotIndex > 0 ? name.substring(0, dotIndex) : name
  const extension = dotIndex > 0 ? name.substring(dotIndex) : ''

  while (usedFilenames.has(finalName.toLowerCase())) {
    finalName = `${base}_${counter++}${extension}`
  }

  usedFilenames.add(finalName.toLowerCase())
  return finalName
}

/**
 * 将日期转为 YYYYMMDD 格式 (例如 20261010)
 */
function formatToYMD(dateInput?: string): string {
  if (dateInput) {
    const match = dateInput.match(/(\d{4})[-/]?(\d{2})[-/]?(\d{2})/)
    if (match) {
      return `${match[1]}${match[2]}${match[3]}`
    }
    const d = new Date(dateInput)
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}${m}${day}`
    }
  }
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

/**
 * 将日期转为标准 YYYY-MM-DD 格式供 FrontMatter 使用
 */
function formatToStandardDate(dateInput?: string): string {
  if (dateInput) {
    const match = dateInput.match(/(\d{4})[-/](\d{2})[-/](\d{2})/)
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`
    }
  }
  return new Date().toISOString().split('T')[0]
}

export async function downloadArticleAsMarkdown(params: ExportMarkdownParams) {
  const { title, summary, categoryName, tagNames, date, attachments } = params
  let { content, cover } = params

  content = content || ''
  const safeTitle = (title || '未命名文章').trim().replace(/[\\/:*?"<>|]/g, '_')
  const ymd = formatToYMD(date)
  const exportBaseName = `${ymd}+${safeTitle}`
  const dateStr = formatToStandardDate(date)

  const zip = new JSZip()
  const imagesFolder = zip.folder('images')

  // 1. 收集文章引用的所有图片 URL（包含封面图、Markdown 图片语法、HTML img 标签语法）
  const imageUrls = new Set<string>()
  if (cover) {
    const cleanCover = cover.trim().split(/\s+/)[0]
    if (cleanCover) imageUrls.add(cleanCover)
  }

  const imageRefs = extractAllImageReferences(content)
  for (const ref of imageRefs) {
    if (ref.rawPath) {
      const cleanUrl = ref.rawPath.trim().split(/\s+/)[0]
      if (cleanUrl) imageUrls.add(cleanUrl)
    }
  }

  // 2. 收集需要下载并打包的附件（结合显式传入的附件列表与正文内提取的附件链接）
  interface AttachmentCandidate {
    url: string
    linkText?: string
    metaFilename?: string
  }
  const attachmentCandidates = new Map<string, AttachmentCandidate>()
  const explicitUrls = new Set<string>()
  const explicitAttachmentsMap = new Map<string, string>()

  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      if (att.url) {
        const cleanUrl = att.url.trim().split(/\s+/)[0]
        if (cleanUrl) {
          explicitUrls.add(cleanUrl)
          if (att.filename) {
            explicitAttachmentsMap.set(cleanUrl, att.filename)
          }
          attachmentCandidates.set(cleanUrl, {
            url: cleanUrl,
            metaFilename: att.filename,
          })
        }
      }
    }
  }

  // 提取正文内容中包含的附件链接
  const contentAttachments = extractAttachmentsFromContent(content, imageUrls)
  for (const item of contentAttachments) {
    const existing = attachmentCandidates.get(item.url)
    if (existing) {
      if (!existing.linkText) existing.linkText = item.linkText
    } else {
      attachmentCandidates.set(item.url, {
        url: item.url,
        linkText: item.linkText,
        metaFilename: explicitAttachmentsMap.get(item.url),
      })
    }
  }

  // 3. 依次顺序下载图片，放置于 images 目录下
  const urlMap = new Map<string, string>()
  const imageArray = Array.from(imageUrls)
  let imgSeq = 1

  for (const url of imageArray) {
    const result = await fetchImageBlob(url)
    if (result && imagesFolder) {
      const cleanCoverUrl = cover ? cover.trim().split(/\s+/)[0] : ''
      const isCover = cleanCoverUrl === url
      const filename = isCover ? `cover.${result.ext}` : `image_${imgSeq++}.${result.ext}`
      imagesFolder.file(filename, result.blob)
      urlMap.set(url, `./images/${filename}`)
    }
  }

  // 4. 依次顺序下载附件，放置于 attachments 目录下
  const attachmentUrlMap = new Map<string, string>()
  const usedAttachmentFilenames = new Set<string>()
  const attachmentCandidatesList = Array.from(attachmentCandidates.values())

  if (attachmentCandidatesList.length > 0) {
    let attachmentsFolder: JSZip | null = null

    for (const item of attachmentCandidatesList) {
      const result = await fetchFileBlob(item.url)
      if (result) {
        if (!attachmentsFolder) {
          attachmentsFolder = zip.folder('attachments')
        }
        const resolvedFilename = resolveAttachmentFilename(
          item.url,
          item.linkText,
          item.metaFilename,
          result.headerFilename,
          result.ext,
          usedAttachmentFilenames
        )

        if (attachmentsFolder) {
          attachmentsFolder.file(resolvedFilename, result.blob)
          attachmentUrlMap.set(item.url, `./attachments/${resolvedFilename}`)
        }
      }
    }
  }

  // 5. 替换封面图相对路径
  if (cover) {
    const cleanCover = cover.trim().split(/\s+/)[0]
    if (urlMap.has(cleanCover)) {
      cover = urlMap.get(cleanCover)
    }
  }

  // 6. 替换正文中引用的图片相对路径
  urlMap.forEach((relativePath, originalUrl) => {
    const escapedUrl = originalUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    content = content.replace(new RegExp(escapedUrl, 'g'), () => relativePath)
  })

  // 7. 替换正文中引用的附件相对路径
  attachmentUrlMap.forEach((relativePath, originalUrl) => {
    const escapedUrl = originalUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    content = content.replace(new RegExp(escapedUrl, 'g'), () => relativePath)

    try {
      if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
        const urlObj = new URL(originalUrl)
        const pathnameAndSearch = urlObj.pathname + urlObj.search
        const escapedPath = pathnameAndSearch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        content = content.replace(new RegExp(escapedPath, 'g'), () => relativePath)
      }
    } catch {}
  })

  // 8. 检查是否有上传了但未在正文中引用的附件，自动在文末附上附件列表
  const unreferencedAttachments: Array<{ filename: string; relativePath: string }> = []
  attachmentUrlMap.forEach((relativePath, originalUrl) => {
    if (!content.includes(relativePath) && !content.includes(originalUrl)) {
      const filename = relativePath.replace(/^\.\/attachments\//, '')
      unreferencedAttachments.push({ filename, relativePath })
    }
  })

  if (unreferencedAttachments.length > 0) {
    content += '\n\n---\n### 附件列表\n'
    unreferencedAttachments.forEach((item) => {
      content += `- [${item.filename}](${item.relativePath})\n`
    })
  }

  // 9. 构造 YAML FrontMatter 标头
  let yamlHeader = '---\n'
  yamlHeader += `title: "${(title || '').replace(/"/g, '\\"')}"\n`
  if (summary) {
    yamlHeader += `summary: "${summary.replace(/"/g, '\\"')}"\n`
  }
  if (cover) {
    yamlHeader += `cover: "${cover.replace(/"/g, '\\"')}"\n`
  }
  if (categoryName) {
    yamlHeader += `category: "${categoryName.replace(/"/g, '\\"')}"\n`
  }
  if (tagNames && tagNames.length > 0) {
    const formattedTags = tagNames.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(', ')
    yamlHeader += `tags: [${formattedTags}]\n`
  }
  yamlHeader += `date: "${dateStr}"\n`
  yamlHeader += '---\n\n'

  const fullText = yamlHeader + content

  // 10. 将 md 文件加入 ZIP 根目录
  zip.file(`${exportBaseName}.md`, fullText)

  // 11. 导出生成 ZIP 文件
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(zipBlob)
  link.download = `${exportBaseName}.zip`
  link.click()
  URL.revokeObjectURL(link.href)
}

