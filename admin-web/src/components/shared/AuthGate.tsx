"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!isAuthenticated && pathname !== "/login" && pathname !== "/signup") {
            router.replace("/login")
        }
    }, [isAuthenticated, pathname, router])

    return <>{children}</>
}


