import { config } from 'md-editor-v3'
import mermaid from 'mermaid'

let isConfigured = false

/**
 * 初始化 md-editor-v3 的全局扩展配置（注入本地 mermaid 实例，支持流程图渲染）
 */
export function initMdConfig() {
  if (isConfigured) return
  isConfigured = true

  // 预初始化 Mermaid 基础配置
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    fontFamily: 'inherit',
  })

  // 注入本地 Mermaid 实例到 md-editor-v3，避免从外部 unpkg CDN 动态加载失败
  config({
    editorExtensions: {
      mermaid: {
        instance: mermaid,
      },
    },
    mermaidConfig(base) {
      return {
        ...base,
        startOnLoad: false,
        securityLevel: 'loose',
      }
    },
  })
}
