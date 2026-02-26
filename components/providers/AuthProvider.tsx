'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, isAdmin: false })

export function AuthProvider({ user, children }: { user: User | null; children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
