/**
 * 文件下载工具类（兼容 file-saver 的 saveAs 导入方式）
 * 支持直接 import { saveAs } from './FileSaverUtil'，无需修改项目原有代码
 */
const FileSaverUtil = {
  /**
   * 核心下载方法：将数据转为可下载文件并触发下载
   * @param {Blob|string|ArrayBuffer|Uint8Array} data - 待下载的原始数据（必填）
   * @param {string} filename - 下载后的文件名（必填，需包含扩展名，如 "report.xlsx"）
   * @param {Object} [options={}] - 配置选项（可选）
   * @param {string} [options.mimeType] - 数据的 MIME 类型（默认根据文件名扩展名推断）
   * @param {boolean} [options.autoBOM=false] - 是否自动添加 UTF-8 BOM（解决文本文件乱码）
   * @throws {Error} 当数据无效或文件名为空时抛出错误
   */
  saveAs(data, filename, options = {}) {
    if (!data || !filename) {
      throw new Error('File "data" and "filename" are required for download')
    }

    const { mimeType = this._guessMimeType(filename), autoBOM = false } = options

    const blob = this._convertToBlob(data, mimeType, autoBOM)

    this._triggerDownload(blob, filename)
  },

  _guessMimeType(filename) {
    const mimeMap = {
      txt: 'text/plain',
      csv: 'text/csv',
      json: 'application/json',
      html: 'text/html',
      xml: 'application/xml',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      zip: 'application/zip',
      pdf: 'application/pdf',
    }
    const ext = filename.split('.').pop().toLowerCase()
    return mimeMap[ext] || 'application/octet-stream'
  },

  _convertToBlob(data, mimeType, autoBOM) {
    if (data instanceof Blob) return data

    if (typeof data === 'string') {
      const bom = autoBOM ? '\uFEFF' : ''
      const uint8Array = new TextEncoder().encode(bom + data)
      return new Blob([uint8Array], { type: mimeType })
    }

    if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      return new Blob([data], { type: mimeType })
    }

    throw new Error(
      `Unsupported data type: ${typeof data} (expected Blob/string/ArrayBuffer/Uint8Array)`,
    )
  },

  _triggerDownload(blob, filename) {
    if (window.URL && HTMLAnchorElement.prototype.download) {
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      return
    }

    // IE 兼容方案
    if (window.navigator?.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename)
      return
    }

    throw new Error('Your browser does not support automatic file download')
  },

  downloadRemoteFile(fileUrl, customFilename, fetchOptions = {}) {
    const defaultFilename = fileUrl.split('/').pop().split('?')[0]
    const filename = customFilename || defaultFilename

    fetch(fileUrl, { method: 'GET', ...fetchOptions, responseType: 'blob' })
      .then(response => {
        if (!response.ok) throw new Error(`Download failed: ${response.statusText}`)
        return response.blob().then(blob => {
          const mimeType = response.headers.get('Content-Type') || this._guessMimeType(filename)
          this.saveAs(blob, filename, { mimeType })
        })
      })
      .catch(error => {
        console.error('Remote download failed:', error)
        throw error
      })
  },
}

export const saveAs = FileSaverUtil.saveAs.bind(FileSaverUtil)

export default FileSaverUtil
