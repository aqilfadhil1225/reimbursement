import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('reimbursement_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const getErrorMessage = (error) => {
  if (!error.response) {
    return 'Backend tidak dapat dihubungi. Jalankan server backend di port 3000.'
  }

  return error.response.data?.message || 'Terjadi kesalahan. Coba lagi.'
}

export default api
