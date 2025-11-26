// Client-side authentication utilities

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

export const getUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch (e) {
        return null
      }
    }
  }
  return null
}

export const setAuth = (token, user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  }
}

export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export const isAuthenticated = () => {
  return !!getToken()
}

export const getAuthHeaders = () => {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

