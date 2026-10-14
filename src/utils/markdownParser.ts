/**
 * Markdown 文档智能解析工具 (与后端 MarkdownParser 保持一致)
 * 支持 YAML Front-matter 元数据、首行一级标题 # 提取与正文去重、纯文本摘要智能截取
 */

export interface ParsedMarkdownArticle {
  title: string
  summary: string
  content: string
  cover?: string
  category?: string
  tags: string[]
  isTop?: boolean
  status?: boolean
}

/**
 * 解析 Markdown 文本内容
 * @param rawContent 原始 Markdown 字符串
 * @param fallbackFilename 当元数据与正文均未指定标题时的兜底文件名（不含扩展名）
 */
export function parseMarkdownArticle(rawContent: string, fallbackFilename = ''): ParsedMarkdownArticle {
  const result: ParsedMarkdownArticle = {
    title: '',
    summary: '',
    content: rawContent || '',
    tags: []
  }

  if (!rawContent || !rawContent.trim()) {
    result.title = fallbackFilename || '无标题文章'
    return result
  }

  let bodyContent = rawContent
  const lines = rawContent.split(/\r?\n/)

  // 1. 解析 YAML Front-matter 元数据
  if (lines.length > 0 && lines[0].trim() === '---') {
    let endIndex = -1
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        endIndex = i
        break
      }
    }

    if (endIndex > 0) {
      const yamlLines = lines.slice(1, endIndex)
      bodyContent = lines.slice(endIndex + 1).join('\n')

      let currentKey = ''
      for (const line of yamlLines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        // 支持 YAML 列表项格式：- tag1
        if (trimmed.startsWith('-') && (currentKey === 'tags' || currentKey === 'tag')) {
          const itemVal = trimmed.replace(/^-\s*/, '').trim()
          if (itemVal) result.tags.push(stripQuotes(itemVal))
          continue
        }

        const colonIdx = line.indexOf(':')
        if (colonIdx > 0) {
          currentKey = line.substring(0, colonIdx).trim().toLowerCase()
          const val = stripQuotes(line.substring(colonIdx + 1).trim())

          if (currentKey === 'title' && val) {
            result.title = val
          } else if ((currentKey === 'summary' || currentKey === 'description' || currentKey === 'desc') && val) {
            result.summary = val
          } else if (currentKey === 'cover' && val) {
            result.cover = val
          } else if ((currentKey === 'category' || currentKey === 'categories') && val) {
            // 兼容 category: [后端, Java] 或 category: 后端
            if (val.startsWith('[') && val.endsWith(']')) {
              const firstCat = val.slice(1, -1).split(',')[0]?.trim()
              if (firstCat) result.category = stripQuotes(firstCat)
            } else {
              result.category = val
            }
          } else if (currentKey === 'tags' || currentKey === 'tag') {
            if (val.startsWith('[') && val.endsWith(']')) {
              const tagList = val.slice(1, -1).split(',').map((t) => stripQuotes(t.trim())).filter(Boolean)
              result.tags.push(...tagList)
            } else if (val) {
              const tagList = val.split(',').map((t) => stripQuotes(t.trim())).filter(Boolean)
              result.tags.push(...tagList)
            }
          } else if (currentKey === 'istop' || currentKey === 'top') {
            result.isTop = val.toLowerCase() === 'true'
          } else if (currentKey === 'status') {
            result.status = val.toLowerCase() === 'true'
          }
        }
      }
    }
  }

  // 2. 标题提取：若 Front-matter 未提供，优先提取正文首行一级标题 # 并从正文首部移除该行（去重优化）
  if (!result.title) {
    const headingMatch = bodyContent.match(/^#\s+(.+)$/m)
    if (headingMatch && headingMatch[1]) {
      result.title = headingMatch[1].trim()
      // 从正文中移除首个 # 标题行，避免文章渲染时页面顶部标题与正文重复
      bodyContent = bodyContent.replace(/^#\s+.+(\r?\n)?/m, '')
    } else {
      result.title = fallbackFilename || '未命名文章'
    }
  }

  // 3. 摘要提取：若 Front-matter 未提供，从正文提取过滤后的纯文本前 150 字符
  if (!result.summary) {
    result.summary = extractPlainTextSummary(bodyContent)
  }

  result.content = bodyContent
  // 标签去重
  result.tags = Array.from(new Set(result.tags))

  return result
}

/**
 * 去除首尾的引号
 */
function stripQuotes(str: string): string {
  if (!str) return ''
  let res = str.trim()
  if ((res.startsWith('"') && res.endsWith('"')) || (res.startsWith("'") && res.endsWith("'"))) {
    res = res.slice(1, -1).trim()
  }
  return res
}

/**
 * 过滤 Markdown 标记提取纯文本摘要
 */
export function extractPlainTextSummary(content: string, maxLength = 150): string {
  if (!content) return ''

  const clean = content
    // 移除多行代码块 ``` ... ```
    .replace(/```[\s\S]*?```/g, '')
    // 移除单行行内代码 `...`
    .replace(/`.*?`/g, '')
    // 移除图片引用 ![alt](url)
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // 移除超链接，仅保留文字 [text](url) -> text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // 移除 HTML 标签
    .replace(/<[^>]+>/g, '')
    // 移除标题标记 #
    .replace(/^#+\s+/gm, '')
    // 移除加粗、斜体、删除线、引用、列表符等
    .replace(/[\*_~>\-#+=]/g, '')
    // 将连续多个空白符（含换行）压缩为一个空格
    .replace(/\s+/g, ' ')
    .trim()

  if (clean.length > maxLength) {
    return clean.substring(0, maxLength) + '...'
  }
  return clean
}

/**
 * 判断图片链接是否为在线链接或已转存至服务器的在线地址（如 http://, https://, //, data:, /api/files/ 等）
 */
export function isRemoteOrUploadedUrl(url: string): boolean {
  if (!url) return false
  const trimmed = url.trim()
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/api/files/') ||
    trimmed.startsWith('/api/') ||
    trimmed.startsWith('/uploads/')
  )
}

/**
 * 提取文章内容中未转存的本地图片路径列表
 */
export function extractUnresolvedLocalImages(content?: string | null): Array<{ rawPath: string; filename: string }> {
  if (!content) return []
  const list: Array<{ rawPath: string; filename: string }> = []
  const unique = new Set<string>()

  // 1. Markdown 语法 ![alt](path)
  const imgRegex = /!\[.*?\]\((.*?)\)/g
  let match
  while ((match = imgRegex.exec(content)) !== null) {
    const rawPath = match[1].trim()
    if (!isRemoteOrUploadedUrl(rawPath)) {
      const filename = decodeURIComponent(rawPath.replace(/^.*[\\\/]/, ''))
      if (filename && !unique.has(rawPath)) {
        unique.add(rawPath)
        list.push({ rawPath, filename })
      }
    }
  }

  // 2. HTML <img> 标签语法
  const htmlImgRegex = /<img\s+[^>]*src=["'](.*?)["']/gi
  while ((match = htmlImgRegex.exec(content)) !== null) {
    const rawPath = match[1].trim()
    if (!isRemoteOrUploadedUrl(rawPath)) {
      const filename = decodeURIComponent(rawPath.replace(/^.*[\\\/]/, ''))
      if (filename && !unique.has(rawPath)) {
        unique.add(rawPath)
        list.push({ rawPath, filename })
      }
    }
  }

  return list
}

/**
 * 判断文章是否包含未转存的本地图片
 */
export function hasUnresolvedLocalImages(content?: string | null): boolean {
  if (!content) return false
  return extractUnresolvedLocalImages(content).length > 0
}
