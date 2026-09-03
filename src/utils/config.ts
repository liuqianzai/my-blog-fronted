import { getConfigs } from '../api/config'

let configCache: Record<string, string> = {}

export async function loadConfigs() {
  try {
    const list = await getConfigs()
    configCache = {}
    list.forEach(item => {
      // 去掉 key 的首尾空格和制表符
      const key = item.configKey.trim()
      configCache[key] = item.configValue
    })
  } catch (e) {
    console.error('加载配置失败:', e)
  }
}

export function getConfigValue(key: string, defaultValue = ''): string {
  return configCache[key] || defaultValue
}

export interface SocialLink {
  name: string
  icon: string
  url: string
}

export function getSocialLinks(): SocialLink[] {
  let list: SocialLink[] = []
  try {
    const json = configCache['social_links']
    if (json) {
      list = JSON.parse(json)
    }
  } catch {
    list = []
  }

  const hasLeetcode = list.some(link => link.url.includes('leetcode.cn'))
  if (!hasLeetcode) {
    list.push({
      name: 'LeetCode',
      icon: 'leetcode',
      url: 'https://leetcode.cn/u/xie-yue-wang-shu/'
    })
  }

  return list
}
