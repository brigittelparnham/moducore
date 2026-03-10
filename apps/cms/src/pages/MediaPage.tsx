import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type MediaItem, API_URL } from '../lib/api'

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/')
}

export function MediaPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    api.media.list()
      .then((data) => setItems(data.media))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    setError('')
    try {
      const uploaded: MediaItem[] = []
      for (const file of Array.from(files)) {
        const data = await api.media.upload(file)
        uploaded.push(data.media)
      }
      setItems((prev) => [...uploaded, ...prev])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file?')) return
    try {
      await api.media.delete(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const copyUrl = (url: string) => {
    const full = `${API_URL}${url}`
    navigator.clipboard.writeText(full)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 14 }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: 20 }}>Media Library</h1>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleUpload(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{
              padding: '8px 16px',
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {isUploading ? 'Uploading…' : 'Upload files'}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ color: 'red', marginBottom: 16, fontSize: 14 }}>{error}</p>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleUpload(e.dataTransfer.files)
        }}
        style={{
          border: '2px dashed #ddd',
          borderRadius: 8,
          padding: '24px',
          textAlign: 'center',
          color: '#aaa',
          fontSize: 14,
          marginBottom: 32,
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? 'Uploading…' : 'Drop files here, or click to select'}
      </div>

      {/* Grid */}
      {isLoading ? (
        <p style={{ color: '#888' }}>Loading…</p>
      ) : items.length === 0 ? (
        <p style={{ color: '#888' }}>No files uploaded yet.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
        }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid #eee',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#fafafa',
              }}
            >
              {/* Thumbnail */}
              <div style={{
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5',
                overflow: 'hidden',
              }}>
                {isImage(item.mimeType) ? (
                  <img
                    src={`${API_URL}${item.url}`}
                    alt={item.filename}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', width: '100%', height: '100%' }}
                  />
                ) : (
                  <span style={{ fontSize: 32 }}>📄</span>
                )}
              </div>

              {/* Info + actions */}
              <div style={{ padding: '10px 12px' }}>
                <p
                  title={item.filename}
                  style={{
                    margin: '0 0 2px',
                    fontSize: 12,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.filename}
                </p>
                <p style={{ margin: '0 0 8px', fontSize: 11, color: '#999' }}>
                  {formatBytes(item.sizeBytes)}
                </p>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => copyUrl(item.url)}
                    style={{
                      flex: 1,
                      fontSize: 11,
                      padding: '4px 0',
                      cursor: 'pointer',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      background: copied === item.url ? '#dcfce7' : '#fff',
                      color: copied === item.url ? '#166534' : '#444',
                    }}
                  >
                    {copied === item.url ? 'Copied!' : 'Copy URL'}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      fontSize: 11,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      border: '1px solid #fca5a5',
                      borderRadius: 4,
                      background: '#fff',
                      color: '#dc2626',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
