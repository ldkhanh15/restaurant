"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  username: string
  full_name: string
  email: string
  phone: string
  ranking: string
  points: number
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

interface RegisterData {
  username: string
  email: string
  password: string
  full_name: string
  phone: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem("restaurant_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (email === "demo@restaurant.com" && password === "demo123") {
        const userData: User = {
          id: "user-1",
          username: "khachhang01",
          full_name: "Nguyễn Văn An",
          email: email,
          phone: "0901234567",
          ranking: "VIP",
          points: 1250,
          avatar_url: "/placeholder.svg?height=40&width=40",
        }
        setUser(userData)
        localStorage.setItem("restaurant_user", JSON.stringify(userData))
        return true
      }
      return false
    } catch (error) {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newUser: User = {
        id: `user-${Date.now()}`,
        username: userData.username,
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        ranking: "Thành Viên",
        points: 0,
        avatar_url: "/placeholder.svg?height=40&width=40",
      }
      setUser(newUser)
      localStorage.setItem("restaurant_user", JSON.stringify(newUser))
      return true
    } catch (error) {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("restaurant_user")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
