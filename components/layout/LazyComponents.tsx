'use client'

import dynamic from 'next/dynamic'

// Lazy-load heavy components that don't need to block initial render
export const LazyPersistentPlayer = dynamic(
  () => import('@/components/soundtrack/PersistentPlayer').then(m => m.PersistentPlayer),
  { ssr: false }
)

export const LazyGlobalUploadModal = dynamic(
  () => import('@/components/layout/GlobalUploadModal').then(m => m.GlobalUploadModal),
  { ssr: false }
)

export const LazyRockBackground = dynamic(
  () => import('@/components/decorative/RockBackground').then(m => m.RockBackground),
  { ssr: false }
)

export const LazyPostAuthSetup = dynamic(
  () => import('@/components/auth/PostAuthSetup').then(m => m.PostAuthSetup),
  { ssr: false }
)
