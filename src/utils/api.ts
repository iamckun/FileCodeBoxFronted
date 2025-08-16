import axios from 'axios'

// 从环境变量中获取 API 基础 URL
const baseURL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_API_BASE_URL_PROD
    : import.meta.env.VITE_API_BASE_URL_DEV

// 确保 baseURL 是一个有效的字符串，并添加 /api/share/ 前缀
const sanitizedBaseURL = typeof baseURL === 'string' ? baseURL : ''
const apiPrefix = '/api/share/file'

// 创建 axios 实例
const api = axios.create({
  baseURL: sanitizedBaseURL,
  timeout: 1000000000000000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // 确保 URL 是有效的，并添加 /api/share/ 前缀
    if (config.url && !config.url.startsWith('http')) {
      // 如果 URL 已经包含 /api/share/ 前缀，则不重复添加
      if (!config.url.startsWith(apiPrefix)) {
        // 处理相对路径和绝对路径
        if (config.url.startsWith('/')) {
          // 绝对路径，如 /share/select/
          config.url = `${apiPrefix}${config.url}`
        } else {
          // 相对路径，如 admin/dashboard
          config.url = `${apiPrefix}/${config.url}`
        }
      }
      // 添加基础 URL
      config.url = `${sanitizedBaseURL}${config.url.startsWith('/') ? '' : '/'}${config.url}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // 处理错误响应
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error('未授权，请重新登录')
          localStorage.clear()
          window.location.href = '/share/file/#/login'
          break
        case 403:
          // 禁止访问
          console.error('禁止访问')
          break
        case 404:
          // 未找到
          console.error('请求的资源不存在')
          break
        default:
          console.error('发生错误:', error.response.data)
      }
    } else if (error.request) {
      console.error('未收到响应:', error.request)
    } else {
      console.error('请求配置错误:', error.message)
    }
    return Promise.reject(error)
  }
)

export default api
