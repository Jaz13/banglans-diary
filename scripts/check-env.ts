#!/usr/bin/env npx tsx
/**
 * Environment Variable Validator
 * Run: npx tsx scripts/check-env.ts
 *
 * Checks that all required environment variables are set before deploying.
 */

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const

const OPTIONAL = [
  'OPEN_REGISTRATION',
  'NEXT_PUBLIC_SITE_URL',
  'RESEND_API_KEY',
] as const

console.log('\n🔍 Environment Variable Check\n')
console.log('─'.repeat(50))

let hasErrors = false

for (const key of REQUIRED) {
  const val = process.env[key]
  if (!val) {
    console.log(`❌  ${key} — MISSING`)
    hasErrors = true
  } else {
    const preview = val.length > 8 ? val.slice(0, 4) + '…' + val.slice(-4) : '****'
    console.log(`✅  ${key} — ${preview}`)
  }
}

console.log('\n─ Optional ─')

for (const key of OPTIONAL) {
  const val = process.env[key]
  if (!val) {
    console.log(`⚠️   ${key} — not set`)
  } else {
    const preview = val.length > 8 ? val.slice(0, 4) + '…' + val.slice(-4) : val
    console.log(`✅  ${key} — ${preview}`)
  }
}

console.log('\n' + '─'.repeat(50))

if (hasErrors) {
  console.log('❌  Some required variables are missing! Check your .env.local\n')
  process.exit(1)
} else {
  console.log('✅  All required environment variables are set!\n')
}
