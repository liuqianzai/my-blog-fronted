/**
 * 拖拽文件提取工具
 * 深度支持读取拖拽进浏览器的整个文件夹（递归遍历子目录），兼容单文件、多文件与文件夹混合拖拽
 */

export async function getAllFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const files: File[] = []
  const items = dataTransfer.items

  if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
    const entries: any[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()
        if (entry) {
          entries.push(entry)
        }
      }
    }

    const promises = entries.map((entry) => readEntryRecursively(entry))
    const results = await Promise.all(promises)
    for (const list of results) {
      files.push(...list)
    }
  } else if (dataTransfer.files && dataTransfer.files.length > 0) {
    files.push(...Array.from(dataTransfer.files))
  }

  return files
}

/**
 * 递归读取 FileSystemEntry (文件或文件夹)
 */
function readEntryRecursively(entry: any): Promise<File[]> {
  return new Promise((resolve) => {
    if (!entry) {
      resolve([])
      return
    }

    if (entry.isFile) {
      entry.file(
        (file: File) => resolve([file]),
        () => resolve([])
      )
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader()
      const entries: any[] = []

      // FileSystemDirectoryReader.readEntries 按规范每次可能只返回部分条目，需要循环读取直到返回空数组
      const readBatch = () => {
        dirReader.readEntries(
          async (batch: any[]) => {
            if (!batch || batch.length === 0) {
              const childPromises = entries.map((child) => readEntryRecursively(child))
              const nestedFiles = await Promise.all(childPromises)
              resolve(nestedFiles.flat())
            } else {
              entries.push(...batch)
              readBatch()
            }
          },
          () => resolve([])
        )
      }
      readBatch()
    } else {
      resolve([])
    }
  })
}
