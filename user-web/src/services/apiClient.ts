import axios, { AxiosResponse, AxiosError } from 'axios'

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Extract data field from response
        return response.data
    },
    (error: AxiosError) => {
        return Promise.reject(error)
    }
)

export default apiClient