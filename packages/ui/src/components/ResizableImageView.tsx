import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const WIDTHS = [
  { label: 'Auto', value: null as string | null },
  { label: '25%', value: '25%' },
  { label: '50%', value: '50%' },
  { label: '75%', value: '75%' },
  { label: '100%', value: '100%' },
]

const ALIGNMENTS = [
  { label: '←', value: 'left', title: 'Align left' },
  { label: '↔', value: 'center', title: 'Align center' },
  { label: '→', value: 'right', title: 'Align right' },
]

export function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const attrs = node.attrs as { src: string; alt?: string; width: string | null; alignment: string }
  const { src, alt, width, alignment } = attrs

  const justify =
    alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center'

  return (
    <NodeViewWrapper
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: justify,
        margin: '0.75em 0',
        userSelect: 'none',
      }}
    >
      {/* Floating controls — only visible when node is selected */}
      {selected && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            background: '#1f2937',
            borderRadius: 6,
            padding: '4px 6px',
            marginBottom: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {/* Width presets */}
          {WIDTHS.map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateAttributes({ width: value })}
              style={{
                padding: '2px 7px',
                fontSize: 11,
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: (width ?? null) === value ? '#3b82f6' : 'transparent',
                color: '#fff',
                fontWeight: (width ?? null) === value ? 700 : 400,
              }}
            >
              {label}
            </button>
          ))}

          {/* Divider */}
          <div style={{ width: 1, background: '#4b5563', alignSelf: 'stretch', margin: '0 4px' }} />

          {/* Alignment */}
          {ALIGNMENTS.map(({ label, value, title }) => (
            <button
              key={value}
              type="button"
              title={title}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateAttributes({ alignment: value })}
              style={{
                padding: '2px 7px',
                fontSize: 12,
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: alignment === value ? '#3b82f6' : 'transparent',
                color: '#fff',
                fontWeight: alignment === value ? 700 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Image */}
      <img
        src={src}
        alt={alt ?? ''}
        style={{
          width: width ?? 'auto',
          maxWidth: '100%',
          height: 'auto',
          borderRadius: 4,
          outline: selected ? '2px solid #3b82f6' : 'none',
          outlineOffset: 2,
          display: 'block',
          cursor: 'default',
        }}
      />
    </NodeViewWrapper>
  )
}
