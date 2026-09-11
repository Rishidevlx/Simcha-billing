// Centralized API Configuration for separate frontend & backend hosting
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
export const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  ME: `${API_BASE_URL}/api/auth/me`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  CATEGORY_BY_ID: (id) => `${API_BASE_URL}/api/categories/${id}`,
  MATERIALS: `${API_BASE_URL}/api/materials`,
  MATERIAL_BY_ID: (id) => `${API_BASE_URL}/api/materials/${id}`,
  MATERIAL_BULK_DELETE: `${API_BASE_URL}/api/materials/bulk-delete`,
  HEALTH: `${API_BASE_URL}/api/health`
}
