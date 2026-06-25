import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" fill="%2394a3b8"%3E%3Crect width="400" height="200" rx="8" fill="%23f1f5f9"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="14"%3E%E5%9B%BE%E7%89%87%E5%8A%A0%E8%BD%BD%E5%A4%B1%E8%B4%A5%3C/text%3E%3C/svg%3E'

const md: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
      } catch {
        // ignore
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

const defaultImageRenderer = md.renderer.rules.image!

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrSet('loading', 'lazy')
  token.attrSet('onerror', `this.onerror=null;this.src='${PLACEHOLDER}'`)
  return defaultImageRenderer(tokens, idx, options, env, self)
}

export function renderMarkdown(content: string): string {
  if (!content) return ''
  const html = md.render(content)
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'loading', 'onerror']
  })
}
