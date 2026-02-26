'use client'

import { useState, useCallback, useRef } from 'react'
import { X, Upload, ImagePlus, Loader2, AlertCircle, Film, Plus, FolderPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { playSuccessSound } from '@/lib/sounds'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import type { Album } from '@/types'

interface UploadModalProps {
  albums: Album[]
  defaultAlbumId?: string
  onClose: () => void
  onUploadComplete: () => void
}

type MediaFile = { file: File; preview: string; type: 'image' | 'video' }

export function UploadModal({ albums: initialAlbums, defaultAlbumId, onClose, onUploadComplete }: UploadModalProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [caption, setCaption] = useState('')
  const [memoryNote, setMemoryNote] = useState('')
  const [takenAt, setTakenAt] = useState('')
  const [albumId, setAlbumId] = useState(defaultAlbumId || '')
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showNewAlbum, setShowNewAlbum] = useState(false)
  const [newAlbumTitle, setNewAlbumTitle] = useState('')
  const [creatingAlbum, setCreatingAlbum] = useState(false)
  const newAlbumInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((newFiles: File[]) => {
    const accepted = newFiles.filter((f) =>
      f.type.startsWith('image/') ||
      f.type.startsWith('video/') ||
      f.name.toLowerCase().endsWith('.heic') ||
      f.name.toLowerCase().endsWith('.heif')
    )
    accepted.forEach((file) => {
      const isVideo = file.type.startsWith('video/')
      if (isVideo) {
        setMediaFiles((prev) => [...prev, { file, preview: '', type: 'video' }])
      } else {
        const reader = new FileReader()
        reader.onload = (e) => {
          setMediaFiles((prev) => [...prev, { file, preview: e.target?.result as string, type: 'image' }])
        }
        reader.readAsDataURL(file)
      }
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }, [handleFiles])

  const removeFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) return
    setCreatingAlbum(true)
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newAlbumTitle.trim() }),
      })
      if (res.ok) {
        const newAlbum = await res.json()
        setAlbums((prev) => [newAlbum, ...prev])
        setAlbumId(newAlbum.id)
        setNewAlbumTitle('')
        setShowNewAlbum(false)
        setCreatingAlbum(false)
        return
      }
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')
      const { data: newAlbum, error: createError } = await supabase
        .from('albums')
        .insert({ title: newAlbumTitle.trim(), created_by: user.id })
        .select()
        .single()
      if (createError || !newAlbum) throw new Error(createError?.message || 'Failed to create album')
      setAlbums((prev) => [newAlbum, ...prev])
      setAlbumId(newAlbum.id)
      setNewAlbumTitle('')
      setShowNewAlbum(false)
    } catch (err: any) {
      setError(err.message || 'Failed to create album')
    } finally {
      setCreatingAlbum(false)
    }
  }

  const uploadOneFile = async (mediaFile: MediaFile, isFirst: boolean) => {
    const { file, type } = mediaFile
    const isVideo = type === 'video'
    const resourceType = isVideo ? 'video' : 'image'
    const cloudName = 'dho6vllbm'

    setStatusMsg('Step 1: Uploading to Cloudinary...')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'banglans_upload')

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: 'POST', body: formData }
    )
    if (!cloudRes.ok) {
      const d = await cloudRes.json().catch(() => ({}))
      throw new Error(d.error?.message || `Cloudinary upload failed (${cloudRes.status})`)
    }
    const uploadResult = await cloudRes.json()

    setStatusMsg('Step 2: Saving to database...')
    const saveRes = await fetch('/api/save-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        albumId,
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        width: uploadResult.width || 0,
        height: uploadResult.height || 0,
        caption: isFirst ? caption : '',
        memoryNote: isFirst ? memoryNote : '',
        mediaType: type,
        takenAt: isFirst ? takenAt : '',
      }),
    })
    if (!saveRes.ok) {
      const d = await saveRes.json().catch(() => ({}))
      throw new Error(d.error || 'Failed to save photo')
    }
  }

  const handleUpload = async () => {
    if (!mediaFiles.length || !albumId) return
    setUploading(true)
    setProgress(0)
    setError('')
    setStatusMsg('')

    try {
      for (let i = 0; i < mediaFiles.length; i++) {
        await uploadOneFile(mediaFiles[i], i === 0)
        setProgress(Math.round(((i + 1) / mediaFiles.length) * 100))
      }
      playSuccessSound()
      onUploadComplete()
      onClose()
    } catch (err: any) {
      console.error('Upload error:', err)
      const msg = err?.message || String(err) || 'Upload failed. Please try again.'
      setError(`${statusMsg ? statusMsg + ' → ' : ''}${msg}`)
    } finally {
      setUploading(false)
      setStatusMsg('')
    }
  }

  const imageCount = mediaFiles.filter((m) => m.type === 'image').length
  const videoCount = mediaFiles.filter((m) => m.type === 'video').length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-border animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 sm:zoom-in-95 duration-300 ease-out">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground font-rock tracking-wider">
            ADD TO THE DIARY
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {mediaFiles.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-secondary/50'
              }`}
            >
              <div className="flex justify-center gap-3 mb-3">
                <ImagePlus className="w-9 h-9 text-primary" />
                <Film className="w-9 h-9 text-accent" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Drop photos & videos here</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG, HEIC, MP4, MOV • No size limit</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {mediaFiles.map((media, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group bg-secondary">
                  {media.type === 'image' ? (
                    <img src={media.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <Film className="w-8 h-8 text-primary" />
                      <p className="text-xs text-muted-foreground text-center px-2 truncate w-full">
                        {media.file.name}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <ImagePlus className="w-6 h-6" />
              </button>
            </div>
          )}

          {mediaFiles.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {imageCount > 0 && `${imageCount} photo${imageCount > 1 ? 's' : ''}`}
              {imageCount > 0 && videoCount > 0 && ' + '}
              {videoCount > 0 && `${videoCount} video${videoCount > 1 ? 's' : ''}`}
              {' selected'}
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.heic,.heif"
            className="hidden"
            onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">Album</label>
              {!showNewAlbum && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAlbum(true)
                    setTimeout(() => newAlbumInputRef.current?.focus(), 50)
                  }}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New album
                </button>
              )}
            </div>

            {showNewAlbum && (
              <div className="mb-2 flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex-1 flex items-center gap-2 bg-secondary border border-primary/40 rounded-xl px-3 py-2">
                  <FolderPlus className="w-4 h-4 text-primary flex-shrink-0" />
                  <input
                    ref={newAlbumInputRef}
                    value={newAlbumTitle}
                    onChange={(e) => setNewAlbumTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleCreateAlbum() }
                      if (e.key === 'Escape') { setShowNewAlbum(false); setNewAlbumTitle('') }
                    }}
                    placeholder="Album name…"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateAlbum}
                  disabled={!newAlbumTitle.trim() || creatingAlbum}
                  className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  {creatingAlbum ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewAlbum(false); setNewAlbumTitle('') }}
                  className="px-2 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {albums.length > 0 ? (
              <>
                <select
                  value={albumId}
                  onChange={(e) => setAlbumId(e.target.value)}
                  className={`w-full bg-secondary border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${
                    !albumId ? 'border-primary/40 text-muted-foreground' : 'border-border text-foreground'
                  }`}
                >
                  {!defaultAlbumId && (
                    <option value="" disabled>— choose an album —</option>
                  )}
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
                {!albumId && (
                  <p className="text-xs text-primary/70 mt-1.5">Pick the album this moment belongs to ↑</p>
                )}
              </>
            ) : (
              <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                <p className="text-sm text-primary">
                  ☝️ Type a name above and hit <strong>Create</strong> to make your first album
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              When was this taken? <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 [color-scheme:dark]"
            />
            <p className="text-xs text-muted-foreground mt-1 italic">Leave blank to use today&apos;s date — or set the real date for older moments.</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">
                Caption <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <EmojiPicker onSelect={(emoji) => setCaption((v) => v + emoji)} />
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What went down that day? 🤘"
              rows={2}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-foreground">
                Memory note <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <EmojiPicker onSelect={(emoji) => setMemoryNote((v) => v + emoji)} />
            </div>
            <p className="text-xs text-muted-foreground mb-1.5 italic">
              A feeling, a backstory, a legendary moment — even if you can&apos;t remember the year.
            </p>
            <textarea
              value={memoryNote}
              onChange={(e) => setMemoryNote(e.target.value)}
              placeholder="It was the night of the Crown Theatre trip, probably 1991. Chengachi bet everyone he could eat three biriyanis and then spent the night on the hostel roof…"
              rows={3}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 resize-none italic placeholder:not-italic"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {uploading && (
            <div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300 shadow-[0_0_8px_oklch(0.75_0.17_68/0.5)]" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {statusMsg || `Uploading ${progress}%...`} {videoCount > 0 && '(videos may take a moment)'}
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!mediaFiles.length || uploading || !albumId}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full py-3 font-bold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-rock tracking-widest"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />UPLOADING...</>
            ) : (
              <><Upload className="w-4 h-4" />
              {mediaFiles.length > 1 ? `UPLOAD ${mediaFiles.length} FILES` : `UPLOAD ${videoCount > 0 ? 'VIDEO' : 'PHOTO'}`}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
