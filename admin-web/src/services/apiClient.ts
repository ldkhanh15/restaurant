"use client"

import axios from "axios"
import { toast } from "react-toastify"

const apiClient = axios.create({
    baseURL: "http://localhost:8000/api",
    withCredentials: false,
})

// apiClient.interceptors.request.use((config) => {
//     if (typeof window !== "undefined") {
//         const token = localStorage.getItem("token")
//         if (token) {
//             config.headers = config.headers ?? {}
//             config.headers.Authorization = `Bearer ${token}`
//         }
//     }
//     return config
// })

// apiClient.interceptors.response.use(
//     (response) => response.data,
//     (error) => {
//         const status = error?.response?.status
//         const message = error?.response?.data?.message || error.message || "Đã xảy ra lỗi"
//         toast.error(message)
//         if (status === 401 && typeof window !== "undefined") {
//             localStorage.removeItem("token")
//             window.location.href = "/login"
//         }
//         return Promise.reject(error)
//     },
// )

export default apiClient


