"use client"

import apiClient from "./apiClient"

type LoginPayload = { email: string; password: string }
type SignupPayload = { email: string; password: string; username: string, role: string }

export const authService = {
    login: (data: LoginPayload) => apiClient.post("/auth/login", data),
    signup: (data: SignupPayload) => apiClient.post("/auth/signup", data),
}

export type { LoginPayload, SignupPayload }


