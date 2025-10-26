/**
 * Cookie 工具类，替代 js-cookie 核心功能
 * 支持设置、获取、删除 Cookie，包含过期时间、路径、域名、Secure/HttpOnly 等配置
 */
const Cookies = {
  /**
   * 设置 Cookie
   * @param {string} name - Cookie 名称（必填）
   * @param {string|number|boolean} value - Cookie 值（必填，会自动转为字符串）
   * @param {Object} [options={}] - 配置选项（可选）
   * @param {number|Date|string} [options.expires] - 过期时间：
   *   - 数字：天数（如 7 表示 7 天后过期）
   *   - Date 对象：指定过期时间点
   *   - 字符串：符合 HTTP 日期格式的字符串（如 "Wed, 21 Oct 2026 07:28:00 GMT"）
   * @param {string} [options.path="/"] - Cookie 生效路径（默认 "/"，确保全站可访问）
   * @param {string} [options.domain] - Cookie 生效域名（默认当前域名，子域名需显式指定，如 ".example.com"）
   * @param {boolean} [options.secure=false] - 是否仅通过 HTTPS 传输（生产环境建议开启）
   * @param {string} [options.sameSite="Lax"] - 跨站请求控制：
   *   - "Strict"：完全禁止跨站携带
   *   - "Lax"：允许 GET 跨站请求携带（默认，兼顾安全与可用性）
   *   - "None"：允许跨站携带（需配合 secure: true 使用）
   * @param {boolean} [options.httpOnly=false] - 是否仅允许服务端访问（前端设置无效，需后端配合，仅作参数兼容）
   * @throws {Error} 当 name 或 value 未提供时抛出错误
   */
  set(name, value, options = {}) {
    // 校验必填参数
    if (!name || value === undefined) {
      throw new Error('Cookie "name" and "value" are required')
    }

    // 处理 value：转为字符串（支持数字/布尔值等类型），特殊字符编码
    const encodedValue = encodeURIComponent(String(value))

    // 基础 Cookie 字符串（名称 + 编码后的值）
    let cookieStr = `${encodeURIComponent(name)}=${encodedValue}`

    // 1. 处理过期时间（expires）
    if (options.expires) {
      let expiresDate
      if (typeof options.expires === 'number') {
        // 数字类型：按天数计算，创建未来日期
        expiresDate = new Date()
        expiresDate.setTime(expiresDate.getTime() + options.expires * 24 * 60 * 60 * 1000)
      } else if (options.expires instanceof Date) {
        // Date 对象：直接使用
        expiresDate = options.expires
      } else if (typeof options.expires === 'string') {
        // 字符串类型：尝试解析为 Date（需符合 HTTP 格式）
        expiresDate = new Date(options.expires)
      }
      // 拼接过期时间（必须转为 GMT 格式）
      if (expiresDate instanceof Date && !isNaN(expiresDate.getTime())) {
        cookieStr += `; expires=${expiresDate.toUTCString()}`
      }
    }

    // 2. 处理路径（path）：默认 "/"（避免仅当前页面生效）
    cookieStr += `; path=${options.path || '/'}`

    // 3. 处理域名（domain）：显式指定时才添加（默认当前域名）
    if (options.domain) {
      cookieStr += `; domain=${options.domain}`
    }

    // 4. 处理 Secure：仅 HTTPS 环境生效
    if (options.secure) {
      cookieStr += '; secure'
    }

    // 5. 处理 SameSite：默认 "Lax"，避免 CSRF 风险
    const sameSite = options.sameSite || 'Lax'
    if (['Strict', 'Lax', 'None'].includes(sameSite)) {
      cookieStr += `; SameSite=${sameSite}`
    }

    // 6. 处理 HttpOnly：前端无法设置（浏览器会忽略），仅作参数兼容提示
    if (options.httpOnly) {
      console.warn(
        'HttpOnly cannot be set by frontend JavaScript (browser restriction), please configure it on the server.',
      )
    }

    // 写入 Cookie
    document.cookie = cookieStr
  },

  /**
   * 获取 Cookie
   * @param {string} [name] - 要获取的 Cookie 名称（可选）：
   *   - 传名称：返回对应 Cookie 的值（未找到则返回 undefined）
   *   - 不传名称：返回所有 Cookie 的键值对对象
   * @returns {string|Object|undefined} Cookie 值或键值对对象
   */
  get(name) {
    // 1. 处理空 Cookie 场景
    if (!document.cookie) {
      return name ? undefined : {}
    }

    // 2. 解析所有 Cookie 为键值对对象
    const cookieMap = document.cookie
      .split('; ') // 按 "; " 分割多个 Cookie（避免分割值中的 ";"）
      .reduce((map, cookie) => {
        const [encodedName, encodedValue] = cookie.split('=')
        // 解码名称和值（处理特殊字符）
        const decodedName = decodeURIComponent(encodedName)
        const decodedValue = encodedValue ? decodeURIComponent(encodedValue) : ''
        map[decodedName] = decodedValue
        return map
      }, {})

    // 3. 按需返回：单个值或所有键值对
    return name ? cookieMap[name] : cookieMap
  },

  /**
   * 删除 Cookie（本质是设置过期时间为过去）
   * @param {string} name - 要删除的 Cookie 名称（必填）
   * @param {Object} [options={}] - 配置选项（需与设置时的 path/domain 一致，否则删除失败）
   * @param {string} [options.path="/"] - 与设置时的 path 一致
   * @param {string} [options.domain] - 与设置时的 domain 一致
   * @param {boolean} [options.secure=false] - 与设置时的 secure 一致
   */
  remove(name, options = {}) {
    // 删除逻辑：设置过期时间为 1970 年（过去时间），触发浏览器自动删除
    this.set(name, '', {
      ...options,
      expires: new Date(0), // 固定为 "Thu, 01 Jan 1970 00:00:00 GMT"
    })
  },

  /**
   * 清除所有 Cookie（需注意 path/domain 一致性，否则可能清除不完整）
   * @param {Object} [options={}] - 配置选项（需与设置时的 path/domain 一致）
   */
  clearAll(options = {}) {
    const allCookies = this.get()
    Object.keys(allCookies).forEach(cookieName => {
      this.remove(cookieName, options)
    })
  },
}

export default Cookies
