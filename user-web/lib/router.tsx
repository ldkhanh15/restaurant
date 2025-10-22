"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type Route =
  | "home"
  | "login"
  | "register"
  | "menu"
  | "tables"
  | "reservations"
  | "order"
  | "profile"
  | "blog"
  | "events"
  | "vouchers"
  | "tracking"
  | "table-detail"
  | "dish-detail"
  | "event-detail"

interface RouterContextType {
  currentRoute: Route
  navigate: (route: Route, params?: Record<string, string>) => void
  goBack: () => void
  history: Route[]
  params: Record<string, string>
}

const RouterContext = createContext<RouterContextType | undefined>(undefined)

const routeToPath: Record<Route, string> = {
  home: "/",
  login: "/login",
  register: "/register",
  menu: "/menu",
  tables: "/tables",
  reservations: "/reservations",
  order: "/order",
  profile: "/profile",
  blog: "/blog",
  events: "/events",
  vouchers: "/vouchers",
  tracking: "/tracking",
  "table-detail": "/tables/:id",
  "dish-detail": "/menu/:id",
  "event-detail": "/events/:id",
}

const pathToRoute: Record<string, Route> = Object.entries(routeToPath).reduce(
  (acc, [route, path]) => {
    acc[path] = route as Route
    return acc
  },
  {} as Record<string, Route>,
)

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentRoute, setCurrentRoute] = useState<Route>("home")
  const [history, setHistory] = useState<Route[]>(["home"])
  const [params, setParams] = useState<Record<string, string>>({})

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      const route = getRouteFromPath(path)
      const extractedParams = extractParamsFromPath(path, route)

      setCurrentRoute(route)
      setParams(extractedParams)
    }

    // Set initial route from URL
    handlePopState()

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const getRouteFromPath = (path: string): Route => {
    // Direct match first
    const directMatch = pathToRoute[path]
    if (directMatch) return directMatch

    // Pattern matching for parameterized routes
    for (const [routePath, route] of Object.entries(pathToRoute)) {
      if (routePath.includes(":")) {
        const pattern = routePath.replace(/:[^/]+/g, "[^/]+")
        const regex = new RegExp(`^${pattern}$`)
        if (regex.test(path)) {
          return route
        }
      }
    }

    return "home"
  }

  const extractParamsFromPath = (path: string, route: Route): Record<string, string> => {
    const routePath = routeToPath[route]
    if (!routePath.includes(":")) return {}

    const pathParts = path.split("/")
    const routeParts = routePath.split("/")
    const params: Record<string, string> = {}

    routeParts.forEach((part, index) => {
      if (part.startsWith(":")) {
        const paramName = part.slice(1)
        params[paramName] = pathParts[index] || ""
      }
    })

    return params
  }

  const navigate = (route: Route, newParams?: Record<string, string>) => {
    let path = routeToPath[route]
    const mergedParams = { ...params, ...newParams }

    // Replace parameters in path
    if (newParams) {
      Object.entries(newParams).forEach(([key, value]) => {
        path = path.replace(`:${key}`, value)
      })
    }

    // Update browser URL
    // window.history.pushState({}, "", path)
    window.location.href = path

    setCurrentRoute(route)
    setHistory((prev) => [...prev, route])
    setParams(mergedParams)
  }

  const goBack = () => {
    if (history.length > 1) {
      window.history.back()
    }
  }

  return (
    <RouterContext.Provider value={{ currentRoute, navigate, goBack, history, params }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  const context = useContext(RouterContext)
  if (context === undefined) {
    throw new Error("useRouter must be used within a RouterProvider")
  }
  return context
}
