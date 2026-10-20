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

  // 移除所有图片语法（含 Obsidian、Markdown 以及 HTML 图片）
  let textWithoutImages = content
  const imgRefs = extractAllImageReferences(content)
  for (const ref of imgRefs) {
    if (ref.fullMatch) {
      textWithoutImages = textWithoutImages.replace(ref.fullMatch, '')
    }
  }

  const clean = textWithoutImages
    // 移除多行代码块 ``` ... ```
    .replace(/```[\s\S]*?```/g, '')
    // 移除单行行内代码 `...`
    .replace(/`.*?`/g, '')
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
 * 图片引用信息定义
 */
export interface MarkdownImageRef {
  fullMatch: string
  rawPath: string
  filename: string
  alt?: string
}

/**
 * 健壮地从 Markdown 与 HTML 中提取所有图片引用（完美兼容路径内含中英文括号、尖括号、标题、引号、Obsidian 语法、img 标签等）
 */
export function extractAllImageReferences(content?: string | null): MarkdownImageRef[] {
  if (!content) return []
  const list: MarkdownImageRef[] = []
  const text = content
  const len = text.length
  let i = 0

  while (i < len) {
    // 1. 支持 Obsidian / WikiLink 图片语法：![[filename.webp]] 或 ![[path/filename.webp|alt]]
    if (text.startsWith('![[', i)) {
      const endIdx = text.indexOf(']]', i + 3)
      if (endIdx !== -1) {
        const fullMatch = text.substring(i, endIdx + 2)
        const inner = text.substring(i + 3, endIdx).trim()
        const pipeIdx = inner.indexOf('|')
        const rawPath = (pipeIdx >= 0 ? inner.substring(0, pipeIdx) : inner).trim()
        const alt = pipeIdx >= 0 ? inner.substring(pipeIdx + 1).trim() : ''
        const filename = extractCleanFilename(rawPath)
        if (rawPath) {
          list.push({ fullMatch, rawPath, filename, alt })
        }
        i = endIdx + 2
        continue
      }
    }

    // 2. 支持标准 Markdown 图片语法：![alt](destination)
    // 关键优化：采用深度括号计数（Balanced Parentheses），解决目录名或文件名中带中英文括号（如“整理稿(基于xxx)”）时被正则错误提前截断的问题
    if (text.startsWith('![', i)) {
      let bracketDepth = 0
      let altEnd = -1
      for (let j = i + 2; j < len; j++) {
        if (text[j] === '\\') {
          j++
          continue
        }
        if (text[j] === '[') bracketDepth++
        else if (text[j] === ']') {
          if (bracketDepth === 0) {
            altEnd = j
            break
          }
          bracketDepth--
        }
      }

      if (altEnd !== -1) {
        let p = altEnd + 1
        while (p < len && (text[p] === ' ' || text[p] === '\t')) p++
        if (p < len && text[p] === '(') {
          const parenStart = p
          let parenDepth = 1
          let inQuotes = false
          let quoteChar = ''
          let parenEnd = -1

          for (let k = parenStart + 1; k < len; k++) {
            const ch = text[k]
            if (ch === '\\') {
              k++
              continue
            }
            if (inQuotes) {
              if (ch === quoteChar) {
                inQuotes = false
              }
            } else {
              if (ch === '"' || ch === "'") {
                inQuotes = true
                quoteChar = ch
              } else if (ch === '(') {
                parenDepth++
              } else if (ch === ')') {
                parenDepth--
                if (parenDepth === 0) {
                  parenEnd = k
                  break
                }
              }
            }
          }

          if (parenEnd !== -1) {
            const fullMatch = text.substring(i, parenEnd + 1)
            const alt = text.substring(i + 2, altEnd)
            const inside = text.substring(parenStart + 1, parenEnd).trim()
            let rawPath = inside
            if (rawPath.startsWith('<')) {
              const closeAngle = rawPath.indexOf('>')
              if (closeAngle > 0) {
                rawPath = rawPath.substring(1, closeAngle).trim()
              }
            } else {
              rawPath = rawPath.split(/\s+["'=]/)[0].trim()
            }
            const filename = extractCleanFilename(rawPath)
            if (rawPath) {
              list.push({ fullMatch, rawPath, filename, alt })
            }
            i = parenEnd + 1
            continue
          }
        }
      }
    }

    // 3. 支持 HTML <img> 标签语法：<img src="..." />
    if (
      text[i] === '<' &&
      (text.startsWith('<img', i) || text.startsWith('<IMG', i)) &&
      (i + 4 < len && /[\s/>]/.test(text[i + 4]))
    ) {
      const tagEnd = text.indexOf('>', i + 4)
      if (tagEnd !== -1) {
        const fullMatch = text.substring(i, tagEnd + 1)
        const srcMatch = fullMatch.match(/src\s*=\s*(?:["']([^"']*)["']|([^\s>]+))/i)
        if (srcMatch) {
          const rawPath = (srcMatch[1] || srcMatch[2] || '').trim()
          if (rawPath) {
            const filename = extractCleanFilename(rawPath)
            list.push({ fullMatch, rawPath, filename })
          }
        }
        i = tagEnd + 1
        continue
      }
    }

    i++
  }

  return list
}

/**
 * 健壮地从图片路径中提取纯文件名（兼容带标题、查询参数、尖括号、URL编码、Windows/Unix路径）
 */
export function extractCleanFilename(rawPath: string): string {
  if (!rawPath) return ''
  // 1. 去除首尾空白与包裹尖括号 <...>
  let clean = rawPath.trim().replace(/^<|>$/g, '').trim()
  // 2. 去除 Markdown 标题与尺寸标记（如 "title" 或 'title' 或 =300x200）
  clean = clean.split(/\s+["'=]/)[0].trim()
  // 3. 去除 URL 查询参数与锚点（?v=1 或 #hash）
  clean = clean.split(/[?#]/)[0].trim()
  // 4. 截取最后一段文件名（兼容 Windows 反斜杠 \ 与 Unix 正斜杠 /）
  const lastSlash = Math.max(clean.lastIndexOf('/'), clean.lastIndexOf('\\'))
  if (lastSlash >= 0) {
    clean = clean.substring(lastSlash + 1)
  }
  // 5. 安全解码 URL 编码与替换加号
  try {
    clean = decodeURIComponent(clean.replace(/\+/g, ' '))
  } catch {
    // 忽略异常保留原样
  }
  return clean.trim()
}

/**
 * 判断图片链接是否为在线链接或已转存至服务器的在线地址（如 http://, https://, //, data:, /api/files/ 等）
 */
export function isRemoteOrUploadedUrl(url: string): boolean {
  if (!url) return false
  const trimmed = url.trim().replace(/^<|>$/g, '').split(/\s+/)[0]
  if (!trimmed) return false

  // 处于非 localhost 部署环境时，若图片链接指向 localhost 或 127.0.0.1，则它在当前网络下不可访问，应视为待转存的本地图片
  const isCurrentLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  if (!isCurrentLocal) {
    if (
      trimmed.startsWith('http://localhost') ||
      trimmed.startsWith('http://127.0.0.1') ||
      trimmed.startsWith('https://localhost') ||
      trimmed.startsWith('https://127.0.0.1')
    ) {
      return false
    }
  }

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
  const allRefs = extractAllImageReferences(content)
  const list: Array<{ rawPath: string; filename: string }> = []
  const unique = new Set<string>()

  for (const ref of allRefs) {
    if (!isRemoteOrUploadedUrl(ref.rawPath)) {
      if (ref.filename && !unique.has(ref.rawPath)) {
        unique.add(ref.rawPath)
        list.push({ rawPath: ref.rawPath, filename: ref.filename })
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
