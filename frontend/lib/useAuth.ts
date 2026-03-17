'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export type AppRole =
  | 'ADMIN'
  | 'PRINCIPAL'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT'
  | 'ACCOUNTANT'
  | 'LIBRARIAN'
  | 'TRANSPORT_STAFF'

export type StoredUser = {
  id: string
  email: string
  role: AppRole
  name?: string
  profile?: any
}

type Options = {
  roles?: AppRole[]
  redirectTo?: string
  denyTo?: string
  denyMessage?: string
}

export function useAuth(options: Options = {}) {
  const { roles, redirectTo = '/auth/login', denyTo = '/dashboard', denyMessage = 'Access denied' } = options
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<StoredUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null

    if (!userData) {
      setReady(true)
      if (pathname !== redirectTo) router.push(redirectTo)
      return
    }

    try {
      const parsed = JSON.parse(userData) as StoredUser
      setUser(parsed)

      if (roles && roles.length > 0 && !roles.includes(parsed.role)) {
        toast.error(denyMessage)
        router.push(denyTo)
      }
    } catch {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      if (pathname !== redirectTo) router.push(redirectTo)
    } finally {
      setReady(true)
    }
  }, [roles?.join(','), redirectTo, denyTo, denyMessage, router, pathname])

  return { user, ready }
}
