import { useEffect, useState } from 'react'
import { api, type MediaItem, API_URL } from '../lib/api'

type Props = {
  onSelect: (url: string) => void
  onClose: () => void
}

export function MediaPicker({ onSelect, onClose }: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.media
      .list()
      .then((data) => setItems(data.media.filter((m) => m.mimeType.startsWith('image/'))))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(700px, 92vw)',
          maxHeight: '76vh',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>Insert image from Media Library</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#666',
              lineHeight: 1,
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Grid */}
        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {isLoading && (
            <p style={{ color: '#888', textAlign: 'center', padding: '32px 0' }}>Loading…</p>
          )}
          {!isLoading && items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#888' }}>
              <p style={{ marginBottom: 8 }}>No images in your media library yet.</p>
              <p style={{ fontSize: 13 }}>
                Upload images in the{' '}
                <a href="/media" style={{ color: '#3b82f6' }}>
                  Media Library
                </a>
                , then come back here to insert them.
              </p>
            </div>
          )}
          {items.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 12,
              }}
            >
              {items.map((item) => (
                <ImageThumb
                  key={item.id}
                  item={item}
                  onSelect={() => onSelect(`${API_URL}${item.url}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ImageThumb({ item, onSelect }: { item: MediaItem; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={item.filename}
      style={{
        padding: 0,
        border: `2px solid ${hovered ? '#3b82f6' : '#eee'}`,
        borderRadius: 8,
        cursor: 'pointer',
        background: '#f5f5f5',
        overflow: 'hidden',
        textAlign: 'left',
        transition: 'border-color 0.12s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <img
        src={`${API_URL}${item.url}`}
        alt={item.filename}
        style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
      />
      <p
        style={{
          margin: 0,
          padding: '6px 8px',
          fontSize: 11,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: '#555',
        }}
      >
        {item.filename}
      </p>
    </button>
  )
}
