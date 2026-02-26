'use client'

import { useState, useEffect } from 'react'
import { User, Save, CheckCheck, Loader2, MapPin, Stethoscope, Tag, KeyRound, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  role: string
  nickname?: string | null
  location?: string | null
  specialty?: string | null
}

const LOCATIONS = [
  'Calicut', 'Thrissur', 'Kochi', 'Trivandrum', 'Bangalore',
  'Chennai', 'Hyderabad', 'Mumbai', 'Delhi', 'Dubai',
  'Qatar', 'UK', 'USA', 'Canada', 'Australia', 'Other'
]

const SPECIALTIES = [
  'General Medicine', 'Surgery', 'Orthopaedics', 'Cardiology', 'Cardiothoracic Surgery',
  'Neurology', 'Neurosurgery', 'Gastroenterology', 'Nephrology', 'Urology',
  'Radiology', 'Anaesthesiology', 'Pathology', 'Psychiatry', 'Paediatrics',
  'Obs & Gynaecology', 'ENT', 'Ophthalmology', 'Dermatology', 'Oncology',
  'Emergency Medicine', 'General Practice', 'Other'
]

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [nickname, setNickname] = useState('')
  const [location, setLocation] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          setFullName(data.full_name || '')
          setNickname(data.nickname || '')
          setLocation(data.location || '')
          setSpecialty(data.specialty || '')
        }
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    load()
  }, [])

  const hasChanges = () => {
    if (!profile) return false
    return (
      fullName.trim() !== (profile.full_name || '') ||
      nickname.trim() !== (profile.nickname || '') ||
      location !== (profile.location || '') ||
      specialty !== (profile.specialty || '')
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const body: Record<string, any> = {
        full_name: fullName.trim(),
        nickname: nickname.trim() || null,
        location: location || null,
        specialty: specialty || null,
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const updated = await res.json()
        setProfile(updated)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save')
      }
    } catch (err) {
      setError('Something went wrong')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1
          className="text-4xl sm:text-5xl font-bold text-primary mb-1 tracking-wide neon-flicker"
          style={{ fontFamily: 'var(--font-rock)' }}
        >
          SETTINGS
        </h1>
        <div className="rock-divider mb-3" />
        <p className="text-muted-foreground">Manage your Banglan profile</p>
      </div>

      {/* Profile card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground tracking-wider uppercase" style={{ fontFamily: 'var(--font-rock)' }}>
            Your Profile
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Full name */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Display Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. Sadik"
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>

          {/* Nickname */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                Banglan Nickname
              </span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Chengachi, Sachin, Kuttan..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
            <p className="text-xs text-muted-foreground/60 mt-1">Your legendary Banglan handle</p>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Current Location
              </span>
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
            >
              <option value="">— Select location —</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Specialty */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              <span className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
                Specialty
              </span>
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
            >
              <option value="">— Select specialty —</option>
              {SPECIALTIES.map(sp => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              readOnly
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground outline-none opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground/60 mt-1">Email cannot be changed</p>
          </div>

          {/* Role (read-only) */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Role</label>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full capitalize uppercase tracking-wider border ${
                profile?.role === 'admin'
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-secondary text-muted-foreground border-border'
              }`}>
                {profile?.role === 'admin' ? '⚡ ADMIN' : 'MEMBER'}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !hasChanges()}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : saved ? (
              <><CheckCheck className="w-4 h-4" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </form>
      </div>

      {/* Change Password card */}
      <ChangePasswordCard />
    </div>
  )
}

function ChangePasswordCard() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaved(true)
    setNewPassword('')
    setConfirmPassword('')
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <KeyRound className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground tracking-wider uppercase" style={{ fontFamily: 'var(--font-rock)' }}>
          Change Password
        </h2>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              minLength={6}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Confirm New Password</label>
          <input
            type={showPass ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            required
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
          />
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !newPassword || !confirmPassword}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors"
          style={{ fontFamily: 'var(--font-rock)' }}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
          ) : saved ? (
            <><CheckCheck className="w-4 h-4" /> Updated!</>
          ) : (
            <><KeyRound className="w-4 h-4" /> Update Password</>
          )}
        </button>
      </form>
    </div>
  )
}
