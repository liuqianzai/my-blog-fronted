/**
 * 常见中文词汇与技术名词映射字典
 */
const COMMON_WORD_MAP: Record<string, string> = {
  // 技术方向
  前端: 'frontend',
  后端: 'backend',
  全栈: 'fullstack',
  架构: 'architecture',
  算法: 'algorithm',
  数据结构: 'data-structure',
  数据库: 'database',
  运维: 'devops',
  安全: 'security',
  网络: 'network',
  系统: 'system',
  测试: 'testing',
  移动端: 'mobile',
  小程序: 'miniapp',
  人工智能: 'ai',
  机器学习: 'ml',
  深度学习: 'deep-learning',
  大数据: 'big-data',
  云计算: 'cloud',
  微服务: 'microservices',
  嵌入式: 'embedded',
  开源: 'opensource',
  项目: 'project',
  实战: 'practices',
  面试: 'interview',
  源码: 'source-code',
  优化: 'optimization',

  // 生活与综合
  技术: 'tech',
  开发: 'dev',
  生活: 'life',
  随笔: 'essay',
  笔记: 'notes',
  杂谈: 'thoughts',
  思考: 'reflections',
  日常: 'daily',
  读书: 'reading',
  阅读: 'reading',
  书单: 'books',
  工具: 'tools',
  效率: 'efficiency',
  摄影: 'photo',
  设计: 'design',
  资源: 'resources',
  教程: 'tutorials',
  指南: 'guide',
  总结: 'summary',
  复盘: 'review',
  影视: 'movies',
  音乐: 'music',
  旅游: 'travel',
  旅行: 'travel',
  美食: 'food',
  分享: 'share'
}

/**
 * 将文本转为 URL Slug 友好字符串
 * @param text 输入文本，例如 "前端开发"、"Vue3 & Vite 实战"
 */
export function generateSlug(text: string): string {
  if (!text) return ''

  let result = text.trim().toLowerCase()

  // 1. 替换常见词汇
  for (const [zh, en] of Object.entries(COMMON_WORD_MAP)) {
    result = result.split(zh).join(`-${en}-`)
  }

  // 2. 替换特殊符号为连字符
  result = result
    .replace(/[&]/g, '-and-')
    .replace(/[@]/g, '-at-')
    .replace(/[+]/g, '-plus-')
    .replace(/[#]/g, '-sharp-')
    // 替换所有非字母、数字、中文及连字符的符号为空格或连字符
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')

  // 3. 将连续的连字符合并为一个
  result = result.replace(/-+/g, '-')

  // 4. 去除首尾连字符
  result = result.replace(/^-+|-+$/g, '')

  // 5. 如果处理后全为空，生成一个基于时间戳的简短备用 slug
  if (!result) {
    result = `cat-${Date.now().toString(36)}`
  }

  return result
}
