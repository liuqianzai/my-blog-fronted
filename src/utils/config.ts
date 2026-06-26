import { getConfigs } from '../api/config'

let configCache: Record<string, string> = {}
let loaded = false

export async function loadConfigs() {
  try {
    const list = await getConfigs()
    configCache = {}
    list.forEach(item => {
      configCache[item.configKey] = item.configValue
    })
    loaded = true
  } catch (e) {
    console.error('加载配置失败:', e)
  }
}

export function getConfigValue(key: string, defaultValue = ''): string {
  return configCache[key] || defaultValue
}

export function isConfigsLoaded(): boolean {
  return loaded
}
