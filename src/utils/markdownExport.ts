import axios from 'axios'
import JSZip from 'jszip'

export interface ExportMarkdownParams {
  title: string
  content: string
  summary?: string
  cover?: string
  categoryName?: string
  tagNames?: string[]
  date?: string
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
    const contentType = response.headers['content-type'] || blob.type || ''
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

export async function downloadArticleAsMarkdown(params: ExportMarkdownParams) {
  const { title, summary, categoryName, tagNames, date } = params
  let { content, cover } = params

  content = content || ''
  const safeTitle = (title || '未命名文章').trim().replace(/[\\/:*?"<>|]/g, '_')
  const dateStr = date ? date.split('T')[0] : new Date().toISOString().split('T')[0]

  const zip = new JSZip()
  const imagesFolder = zip.folder('images')

  // 1. 收集文章引用的所有图片 URL（包含封面图、Markdown 图片语法、HTML img 标签语法）
  const imageUrls = new Set<string>()
  if (cover) {
    const cleanCover = cover.trim().split(/\s+/)[0]
    if (cleanCover) imageUrls.add(cleanCover)
  }

  const mdImgRegex = /!\[.*?\]\((.*?)\)/g
  let match: RegExpExecArray | null
  while ((match = mdImgRegex.exec(content)) !== null) {
    const rawUrl = match[1]
    if (rawUrl) {
      const cleanUrl = rawUrl.trim().split(/\s+/)[0]
      if (cleanUrl) imageUrls.add(cleanUrl)
    }
  }

  const htmlImgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi
  while ((match = htmlImgRegex.exec(content)) !== null) {
    const rawUrl = match[1]
    if (rawUrl) {
      const cleanUrl = rawUrl.trim().split(/\s+/)[0]
      if (cleanUrl) imageUrls.add(cleanUrl)
    }
  }

  // 2. 依次顺序下载图片，放置于 images 目录下，避免并发竞态导致的同名覆盖
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

  // 3. 替换封面图相对路径
  if (cover) {
    const cleanCover = cover.trim().split(/\s+/)[0]
    if (urlMap.has(cleanCover)) {
      cover = urlMap.get(cleanCover)
    }
  }

  // 4. 替换正文中引用的图片相对路径
  urlMap.forEach((relativePath, originalUrl) => {
    const escapedUrl = originalUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regex = new RegExp(escapedUrl, 'g')
    content = content.replace(regex, () => relativePath)
  })

  // 5. 构造 YAML FrontMatter 标头
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

  // 如果设置了封面图且正文中尚未包含该封面图图片语法，自动在正文顶部插入图片供 Typora 渲染预览
  if (cover && !content.includes(cover)) {
    content = `![封面图](${cover})\n\n` + content
  }

  const fullText = yamlHeader + content

  // 6. 将 md 文件加入 ZIP 根目录
  zip.file(`${safeTitle}.md`, fullText)

  // 7. 导出生成 ZIP 文件
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(zipBlob)
  link.download = `${safeTitle}.zip`
  link.click()
  URL.revokeObjectURL(link.href)
}
