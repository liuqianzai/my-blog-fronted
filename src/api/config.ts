import request from '../utils/request'

export interface Config {
  configKey: string
  configValue: string
  remark: string
}

export const getConfigs = () =>
  request.get<any, Config[]>('/configs')

export const getConfig = (key: string) =>
  request.get<any, Config>(`/configs/${key}`)

export const saveConfig = (data: Config) =>
  request.post('/configs', data)

export const deleteConfig = (key: string) =>
  request.delete(`/configs/${key}`)
