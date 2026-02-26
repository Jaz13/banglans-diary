'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Copy, CheckCheck, Clock, UserCheck, MessageCircle, Share2, Link, RefreshCw, AlertCircle, Trash2, X, Shield, Eye, Lock } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Invite } from '@/types'

interface FamilyMember {
  id: string
  user_id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'admin' | 'member'
  joined_at: string
}

export default function InviteMembersPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [invites, setInvites] = useState<Invite[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [freshLink, setFreshLink] = useState<string | null>(null)
  const [freshCopied, setFreshCopied] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clearingExpired, setClearingExpired] = useState(false)
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [userRole, setUserRole] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [invitesRes, membersRes] = await Promise.all([
        fetch('/api/invite'),
        fetch('/api/members'),
      ])
      if (invitesRes.ok) setInvites(await invitesRes.json())
      if (membersRes.ok) setMembers(await membersRes.json())
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Check role quickly, then load data in parallel
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data: profile }) => {
          setUserRole(profile?.role || 'member')
        })
      }
    })
    loadData()
  }, [loadData])

  // Role gate — only admins can access this page
  if (userRole !== null && userRole !== 'admin') {
    return (
      <div className="max-w-2xl">
        <div className="text-center py-20 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h2
            className="text-xl font-bold text-foreground mb-2 tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            Admin Access Only
          </h2>
          <p className="text-muted-foreground">Only admins can manage invites and Banglan members.</p>
        </div>
      </div>
    )
  }

  // Generate a link without requiring email (uses a placeholder)
  const generateLink = async () => {
    setSending(true)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `invite-${Date.now()}@banglans-diary.app`, role: inviteRole }),
      })
      if (res.ok) {
        const data = await res.json()
        const link = `${window.location.origin}/invite/${data.token}`
        setFreshLink(link)
        loadData()
      }
    } catch (err) {
      console.error(err)
    }
    setSending(false)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role: inviteRole }),
      })
      if (res.ok) {
        const data = await res.json()
        const link = `${window.location.origin}/invite/${data.token}`
        setFreshLink(link)
        setSent(true)
        setEmail('')
        setTimeout(() => setSent(false), 4000)
        loadData()
      }
    } catch (err) {
      console.error(err)
    }
    setSending(false)
  }

  const copyLink = async (link: string, id?: string) => {
    await navigator.clipboard.writeText(link)
    if (id) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } else {
      setFreshCopied(true)
      setTimeout(() => setFreshCopied(false), 2000)
    }
  }

  const shareWhatsApp = (link: string) => {
    const msg = encodeURIComponent(`You're invited to The Banglans Diary — our private legends-only space!\n\nJoin here: ${link}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const shareNative = async (link: string) => {
    if (navigator.share) {
      await navigator.share({
        title: 'Join The Banglans Diary',
        text: "You're invited to the Banglan inner circle!",
        url: link,
      })
    } else {
      copyLink(link)
    }
  }

  const handleResend = async (inviteId: string) => {
    setResendingId(inviteId)
    try {
      const res = await fetch('/api/invite/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      })
      if (res.ok) {
        await loadData()
      }
    } catch (err) {
      console.error(err)
    }
    setResendingId(null)
  }

  const handleDelete = async (inviteId: string) => {
    setDeletingId(inviteId)
    try {
      const res = await fetch(`/api/invite/${inviteId}`, { method: 'DELETE' })
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== inviteId))
      }
    } catch (err) {
      console.error(err)
    }
    setDeletingId(null)
  }

  const handleClearExpired = async () => {
    setClearingExpired(true)
    try {
      const res = await fetch('/api/invite/clear-expired', { method: 'DELETE' })
      if (res.ok) {
        await loadData()
      }
    } catch (err) {
      console.error(err)
    }
    setClearingExpired(false)
  }

  const isExpired = (invite: Invite) =>
    invite.status === 'expired' || (invite.status === 'pending' && new Date(invite.expires_at) < new Date())

  const getTimeLeft = (invite: Invite) => {
    if (isExpired(invite)) return 'Expired'
    return `Expires ${formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}`
  }

  const getInviteLink = (invite: Invite) =>
    `${window.location.origin}/invite/${invite.token}`

  const statusColor = (status: Invite['status']) => {
    if (status === 'accepted') return 'text-amber-600 bg-amber-50'
    if (status === 'pending') return 'text-amber-600 bg-amber-50'
    return 'text-muted-foreground bg-secondary'
  }

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1
          className="text-4xl sm:text-5xl font-bold text-primary mb-1 tracking-wide neon-flicker"
          style={{ fontFamily: 'var(--font-rock)' }}
        >
          INVITE THE BANGLANS
        </h1>
        <div className="rock-divider mb-3" />
        <p className="text-muted-foreground">Bring the legends in</p>
      </div>

      {/* Role selector — choose what role the invitee will get */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-primary" />
          <h2
            className="text-lg font-bold text-foreground tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            Invite as...
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Choose the access level for the Banglan you&apos;re inviting.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setInviteRole('member')}
            className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              inviteRole === 'member'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/30 bg-secondary/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Eye className={`w-4 h-4 ${inviteRole === 'member' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-bold uppercase tracking-wider ${inviteRole === 'member' ? 'text-foreground' : 'text-muted-foreground'}`}
                style={{ fontFamily: 'var(--font-rock)' }}>
                Member
              </span>
            </div>
            <span className="text-xs text-muted-foreground leading-relaxed">
              View, like, comment &amp; react to posts. Cannot upload or manage.
            </span>
          </button>
          <button
            onClick={() => setInviteRole('admin')}
            className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              inviteRole === 'admin'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/30 bg-secondary/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${inviteRole === 'admin' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-bold uppercase tracking-wider ${inviteRole === 'admin' ? 'text-foreground' : 'text-muted-foreground'}`}
                style={{ fontFamily: 'var(--font-rock)' }}>
                Admin
              </span>
            </div>
            <span className="text-xs text-muted-foreground leading-relaxed">
              Full access — upload, delete, manage posts &amp; invite other Banglans.
            </span>
          </button>
        </div>
      </div>

      {/* Quick share — generate a link instantly */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link className="w-5 h-5 text-primary" />
          <h2
            className="text-lg font-bold text-foreground tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            Share Invite Link
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Generate a private invite link and send it via WhatsApp, iMessage, or any app.
          {' '}
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            inviteRole === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground border border-border'
          }`}>
            {inviteRole === 'admin' ? <Shield className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {inviteRole === 'admin' ? 'Admin invite' : 'Member invite'}
          </span>
        </p>

        {!freshLink ? (
          <button
            onClick={generateLink}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full py-3 font-bold text-sm uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            <Link className="w-4 h-4" />
            {sending ? 'Generating...' : 'Generate Invite Link'}
          </button>
        ) : (
          <div className="space-y-3">
            {/* Link display */}
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground flex-1 truncate font-mono">{freshLink}</p>
              <button
                onClick={() => copyLink(freshLink)}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-border transition-colors"
              >
                {freshCopied ? <CheckCheck className="w-4 h-4 text-amber-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            {/* Share buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => shareWhatsApp(freshLink)}
                className="flex items-center justify-center gap-2 bg-green-500 text-white rounded-full py-2.5 text-sm font-medium hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={() => shareNative(freshLink)}
                className="flex items-center justify-center gap-2 bg-blue-500 text-white rounded-full py-2.5 text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => copyLink(freshLink)}
                className="flex items-center justify-center gap-2 bg-secondary border border-border text-foreground rounded-full py-2.5 text-sm font-medium hover:bg-border transition-colors"
              >
                {freshCopied ? <CheckCheck className="w-4 h-4 text-amber-500" /> : <Copy className="w-4 h-4" />}
                {freshCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => { setFreshLink(null) }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Generate a new link
            </button>
          </div>
        )}
      </div>

      {/* Invite by email (optional) */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Share2 className="w-5 h-5 text-primary" />
          <h2
            className="text-lg font-bold text-foreground tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            Invite by Email
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Enter their email to personalise the invite link, then share it yourself.
        </p>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="banglan@example.com"
            required
            className="flex-1 bg-secondary border border-border rounded-full px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            {sent ? <><CheckCheck className="w-4 h-4" />Done!</> : sending ? 'Creating...' : 'Create Link'}
          </button>
        </form>
      </div>

      {/* Loading skeletons for members/invites */}
      {loading && (
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <div className="h-5 w-40 bg-secondary rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-border" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-32 bg-border rounded" />
                    <div className="h-3 w-48 bg-border rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Banglan members */}
      {!loading && members.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-primary" />
            <h2
              className="text-lg font-bold text-foreground tracking-wider uppercase"
              style={{ fontFamily: 'var(--font-rock)' }}
            >
              The Banglans ({members.length})
            </h2>
          </div>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-semibold text-sm flex items-center justify-center flex-shrink-0">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                  ) : initials(member.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{member.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                  member.role === 'admin'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-secondary text-muted-foreground border border-border'
                }`}>
                  {member.role === 'admin' ? <Shield className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending & expired invites */}
      {!loading && invites.filter(i => i.status !== 'accepted').length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2
                className="text-lg font-bold text-foreground tracking-wider uppercase"
                style={{ fontFamily: 'var(--font-rock)' }}
              >
                Invites ({invites.filter(i => i.status !== 'accepted').length})
              </h2>
            </div>
            {/* Clear all expired button */}
            {invites.some(i => isExpired(i)) && (
              <button
                onClick={handleClearExpired}
                disabled={clearingExpired}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                {clearingExpired ? 'Clearing...' : 'Clear expired'}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {invites.filter(i => i.status !== 'accepted').map((invite) => {
              const expired = isExpired(invite)
              return (
                <div key={invite.id} className={`flex items-center gap-3 p-3 rounded-xl ${expired ? 'bg-red-50/60 border border-red-200/50' : 'bg-secondary'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {invite.email.endsWith('@banglans-diary.app') ? 'Open link (any email)' : invite.email}
                      </p>
                      {/* Role badge on each invite */}
                      <span className={`flex-shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        invite.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground border border-border'
                      }`}>
                        {invite.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                        {invite.role || 'member'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        Sent {format(new Date(invite.created_at), 'MMM d, yyyy')}
                      </p>
                      <span className="text-xs text-muted-foreground/50">·</span>
                      <p className={`text-xs font-medium ${expired ? 'text-red-500' : 'text-amber-500'}`}>
                        {expired && <AlertCircle className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
                        {getTimeLeft(invite)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {expired ? (
                      <>
                        <button
                          onClick={() => handleResend(invite.id)}
                          disabled={resendingId === invite.id}
                          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors"
                          style={{ fontFamily: 'var(--font-rock)' }}
                          title="Resend with new link"
                        >
                          <RefreshCw className={`w-3 h-3 ${resendingId === invite.id ? 'animate-spin' : ''}`} />
                          Resend
                        </button>
                        <button
                          onClick={() => handleDelete(invite.id)}
                          disabled={deletingId === invite.id}
                          className="p-2 rounded-xl hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete invite"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => shareWhatsApp(getInviteLink(invite))}
                          className="p-2 rounded-xl hover:bg-green-100 text-green-600 transition-colors"
                          title="Share on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyLink(getInviteLink(invite), invite.id)}
                          className="p-2 rounded-xl hover:bg-border transition-colors text-muted-foreground hover:text-foreground"
                          title="Copy invite link"
                        >
                          {copiedId === invite.id ? <CheckCheck className="w-4 h-4 text-amber-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(invite.id)}
                          disabled={deletingId === invite.id}
                          className="p-2 rounded-xl hover:bg-red-100 text-muted-foreground/40 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Revoke invite"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading && invites.length === 0 && members.length <= 1 && (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <Users className="w-12 h-12 text-primary/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No Banglans yet. Generate a link above to bring the legends in!</p>
        </div>
      )}
    </div>
  )
}
