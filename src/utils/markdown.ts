import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" fill="%2394a3b8"%3E%3Crect width="400" height="200" rx="8" fill="%23f1f5f9"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="14"%3E%E5%9B%BE%E7%89%87%E5%8A%A0%E8%BD%BD%E5%A4%B1%E8%B4%A5%3C/text%3E%3C/svg%3E'

const md: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
})

// 标题 ID 生成器，供侧边大纲目录锚点定位使用
let headingIdCounter = 0
const defaultHeadingOpen = md.renderer.rules.heading_open || ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const nextToken = tokens[idx + 1]
  const title = nextToken && nextToken.children ? nextToken.children.map(t => t.content).join('') : ''
  const id = `heading-${headingIdCounter++}`
  token.attrSet('id', id)
  token.attrSet('data-title', title)
  return defaultHeadingOpen(tokens, idx, options, env, self)
}

// 代码块增强渲染：支持语言标识、行数统计、代码复制，并在超过 500 行时默认自动折叠
function renderCustomCodeBlock(rawCode: string, rawLang: string): string {
  const lines = rawCode.replace(/\r\n/g, '\n').split('\n')
  const lineCount = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length
  const isOver500 = lineCount > 500

  const lang = rawLang ? rawLang.trim().split(/\s+/)[0] : ''
  let highlighted = ''
  if (lang && hljs.getLanguage(lang)) {
    try {
      highlighted = hljs.highlight(rawCode, { language: lang, ignoreIllegals: true }).value
    } catch {
      highlighted = md.utils.escapeHtml(rawCode)
    }
  } else {
    highlighted = md.utils.escapeHtml(rawCode)
  }

  const langLabel = lang ? lang.toUpperCase() : 'CODE'
  const collapsedClass = isOver500 ? 'is-collapsed' : ''

  return `<div class="code-block-container ${collapsedClass}" data-lines="${lineCount}" data-lang="${langLabel}"><div class="code-block-header"><div class="code-block-info"><span class="code-lang-badge">${langLabel}</span><span class="code-lines-badge">${lineCount} 行</span>${isOver500 ? '<span class="code-collapsed-tag">长代码自动折叠</span>' : ''}</div><button type="button" class="code-copy-btn" title="复制代码"><svg class="copy-icon w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z"/><path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2"/></svg><span class="copy-text">复制</span></button></div><div class="code-block-body"><pre class="hljs"><code>${highlighted}</code></pre>${isOver500 ? '<div class="code-collapse-mask"></div>' : ''}</div>${isOver500 ? `<div class="code-collapse-bar"><button type="button" class="code-collapse-btn"><svg class="chevron-icon w-4 h-4 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg><span class="collapse-btn-text">代码超过 500 行，点击展开全部 (${lineCount} 行)</span></button></div>` : ''}</div>`
}

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx]
  return renderCustomCodeBlock(token.content, token.info)
}

md.renderer.rules.code_block = (tokens, idx) => {
  const token = tokens[idx]
  return renderCustomCodeBlock(token.content, '')
}

const defaultImageRenderer = md.renderer.rules.image!

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrSet('loading', 'lazy')
  token.attrSet('onerror', `this.onerror=null;this.src='${PLACEHOLDER}'`)
  return defaultImageRenderer(tokens, idx, options, env, self)
}

export function renderMarkdown(content: string): string {
  if (!content) return ''
  headingIdCounter = 0
  const html = md.render(content)
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe', 'button', 'svg', 'path', 'span'],
    ADD_ATTR: [
      'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'loading', 'onerror',
      'id', 'data-title', 'data-lines', 'data-lang',
      'd', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'title'
    ]
  })
}
