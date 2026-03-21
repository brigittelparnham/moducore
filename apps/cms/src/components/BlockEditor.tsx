import { useState, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { RichTextEditor } from '@moducore/ui'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlockType = 'heading' | 'text' | 'image' | 'divider' | 'button' | 'spacer' | 'code'

export type HeadingBlock = { id: string; type: 'heading'; text: string; level: 1 | 2 | 3; align: 'left' | 'center' | 'right' }
export type TextBlock = { id: string; type: 'text'; html: string }
export type ImageBlock = { id: string; type: 'image'; url: string; alt: string; width: 'full' | 'wide' | 'medium'; align: 'left' | 'center' | 'right' }
export type DividerBlock = { id: string; type: 'divider'; style: 'solid' | 'dashed' | 'dotted' }
export type ButtonBlock = { id: string; type: 'button'; label: string; href: string; variant: 'primary' | 'outline'; align: 'left' | 'center' | 'right' }
export type SpacerBlock = { id: string; type: 'spacer'; height: number }
export type CodeBlock = { id: string; type: 'code'; code: string; language: string }

export type Block = HeadingBlock | TextBlock | ImageBlock | DividerBlock | ButtonBlock | SpacerBlock | CodeBlock

// ─── Utils ────────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function makeBlock(type: BlockType): Block {
  switch (type) {
    case 'heading': return { id: uid(), type: 'heading', text: '', level: 2, align: 'left' }
    case 'text': return { id: uid(), type: 'text', html: '' }
    case 'image': return { id: uid(), type: 'image', url: '', alt: '', width: 'full', align: 'center' }
    case 'divider': return { id: uid(), type: 'divider', style: 'solid' }
    case 'button': return { id: uid(), type: 'button', label: 'Click here', href: '', variant: 'primary', align: 'left' }
    case 'spacer': return { id: uid(), type: 'spacer', height: 40 }
    case 'code': return { id: uid(), type: 'code', code: '', language: 'typescript' }
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '12px 14px',
  marginTop: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }

const label: React.CSSProperties = { fontSize: 12, color: '#6b7280', width: 56, flexShrink: 0 }

const inp: React.CSSProperties = {
  flex: 1,
  padding: '5px 8px',
  border: '1px solid #d1d5db',
  borderRadius: 5,
  fontSize: 13,
  minWidth: 0,
}

function Seg({ options, value, onChange }: { options: { v: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            border: '1px solid #d1d5db',
            borderRadius: 4,
            cursor: 'pointer',
            background: value === o.v ? '#111' : '#fff',
            color: value === o.v ? '#fff' : '#374151',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Block editors ────────────────────────────────────────────────────────────

function HeadingEditor({ block, onChange }: { block: HeadingBlock; onChange: (b: HeadingBlock) => void }) {
  return (
    <div style={panel}>
      <div style={row}>
        <span style={label}>Text</span>
        <input style={inp} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="Heading text…" />
      </div>
      <div style={row}>
        <span style={label}>Level</span>
        <Seg
          value={String(block.level)}
          options={[{ v: '1', label: 'H1' }, { v: '2', label: 'H2' }, { v: '3', label: 'H3' }]}
          onChange={(v) => onChange({ ...block, level: Number(v) as 1 | 2 | 3 })}
        />
        <span style={{ ...label, width: 'auto', marginLeft: 8 }}>Align</span>
        <Seg
          value={block.align}
          options={[{ v: 'left', label: '⬅' }, { v: 'center', label: '↔' }, { v: 'right', label: '➡' }]}
          onChange={(v) => onChange({ ...block, align: v as HeadingBlock['align'] })}
        />
      </div>
    </div>
  )
}

function TextEditor({ block, onChange, onPickImage }: { block: TextBlock; onChange: (b: TextBlock) => void; onPickImage?: () => Promise<string | null> }) {
  return (
    <div style={{ marginTop: 8 }}>
      <RichTextEditor
        key={block.id}
        initialContent={block.html}
        onChange={(html) => onChange({ ...block, html })}
        placeholder="Write content…"
        minHeight={120}
        onPickImage={onPickImage}
      />
    </div>
  )
}

function ImageEditor({ block, onChange, onPickImage }: { block: ImageBlock; onChange: (b: ImageBlock) => void; onPickImage?: () => Promise<string | null> }) {
  return (
    <div style={panel}>
      <div style={row}>
        <span style={label}>URL</span>
        <input style={inp} value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} placeholder="https://…" />
        {onPickImage && (
          <button
            onClick={async () => {
              const url = await onPickImage()
              if (url) onChange({ ...block, url })
            }}
            style={{ padding: '5px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 5, cursor: 'pointer', background: '#fff' }}
          >
            Pick
          </button>
        )}
      </div>
      <div style={row}>
        <span style={label}>Alt text</span>
        <input style={inp} value={block.alt} onChange={(e) => onChange({ ...block, alt: e.target.value })} placeholder="Describe the image…" />
      </div>
      <div style={row}>
        <span style={label}>Width</span>
        <Seg
          value={block.width}
          options={[{ v: 'medium', label: 'Medium' }, { v: 'wide', label: 'Wide' }, { v: 'full', label: 'Full' }]}
          onChange={(v) => onChange({ ...block, width: v as ImageBlock['width'] })}
        />
        <span style={{ ...label, width: 'auto', marginLeft: 8 }}>Align</span>
        <Seg
          value={block.align}
          options={[{ v: 'left', label: '⬅' }, { v: 'center', label: '↔' }, { v: 'right', label: '➡' }]}
          onChange={(v) => onChange({ ...block, align: v as ImageBlock['align'] })}
        />
      </div>
      {block.url && (
        <img src={block.url} alt={block.alt} style={{ maxWidth: 200, borderRadius: 4, border: '1px solid #e5e7eb' }} />
      )}
    </div>
  )
}

function DividerEditor({ block, onChange }: { block: DividerBlock; onChange: (b: DividerBlock) => void }) {
  return (
    <div style={panel}>
      <div style={row}>
        <span style={label}>Style</span>
        <Seg
          value={block.style}
          options={[{ v: 'solid', label: 'Solid' }, { v: 'dashed', label: 'Dashed' }, { v: 'dotted', label: 'Dotted' }]}
          onChange={(v) => onChange({ ...block, style: v as DividerBlock['style'] })}
        />
      </div>
    </div>
  )
}

function ButtonEditor({ block, onChange }: { block: ButtonBlock; onChange: (b: ButtonBlock) => void }) {
  return (
    <div style={panel}>
      <div style={row}>
        <span style={label}>Label</span>
        <input style={inp} value={block.label} onChange={(e) => onChange({ ...block, label: e.target.value })} placeholder="Button text…" />
      </div>
      <div style={row}>
        <span style={label}>Link</span>
        <input style={inp} value={block.href} onChange={(e) => onChange({ ...block, href: e.target.value })} placeholder="https://…" />
      </div>
      <div style={row}>
        <span style={label}>Style</span>
        <Seg
          value={block.variant}
          options={[{ v: 'primary', label: 'Primary' }, { v: 'outline', label: 'Outline' }]}
          onChange={(v) => onChange({ ...block, variant: v as ButtonBlock['variant'] })}
        />
        <span style={{ ...label, width: 'auto', marginLeft: 8 }}>Align</span>
        <Seg
          value={block.align}
          options={[{ v: 'left', label: '⬅' }, { v: 'center', label: '↔' }, { v: 'right', label: '➡' }]}
          onChange={(v) => onChange({ ...block, align: v as ButtonBlock['align'] })}
        />
      </div>
    </div>
  )
}

const CODE_LANGUAGES = ['typescript', 'javascript', 'python', 'bash', 'sql', 'json', 'html', 'css', 'rust', 'go', 'plaintext']

function CodeEditor({ block, onChange }: { block: CodeBlock; onChange: (b: CodeBlock) => void }) {
  return (
    <div style={panel}>
      <div style={row}>
        <span style={label}>Language</span>
        <select
          value={block.language}
          onChange={(e) => onChange({ ...block, language: e.target.value })}
          style={{ ...inp, flex: 'none', width: 140 }}
        >
          {CODE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <textarea
        value={block.code}
        onChange={(e) => onChange({ ...block, code: e.target.value })}
        placeholder="// paste your code here…"
        rows={8}
        style={{
          width: '100%',
          fontFamily: 'monospace',
          fontSize: 13,
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          background: '#1e1e2e',
          color: '#cdd6f4',
          resize: 'vertical',
          boxSizing: 'border-box',
          lineHeight: 1.6,
        }}
        spellCheck={false}
      />
    </div>
  )
}

function SpacerEditor({ block, onChange }: { block: SpacerBlock; onChange: (b: SpacerBlock) => void }) {
  return (
    <div style={panel}>
      <div style={row}>
        <span style={label}>Height</span>
        <input
          type="range"
          min={8}
          max={200}
          step={8}
          value={block.height}
          onChange={(e) => onChange({ ...block, height: Number(e.target.value) })}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: 13, color: '#374151', width: 40 }}>{block.height}px</span>
      </div>
    </div>
  )
}

// ─── Block row ────────────────────────────────────────────────────────────────

const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Heading',
  text: 'Text',
  image: 'Image',
  divider: 'Divider',
  button: 'Button',
  spacer: 'Spacer',
  code: 'Code',
}

function BlockRow({
  block,
  onChange,
  onDelete,
  onPickImage,
}: {
  block: Block
  onChange: (b: Block) => void
  onDelete: () => void
  onPickImage?: () => Promise<string | null>
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 8,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {/* Block header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', color: '#9ca3af', fontSize: 16, lineHeight: 1, userSelect: 'none' }}
          title="Drag to reorder"
        >
          ⠿
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', flex: 1 }}>
          {BLOCK_LABELS[block.type]}
          {block.type === 'heading' && block.text ? ` — ${block.text.slice(0, 40)}` : ''}
        </span>
        <button
          onClick={onDelete}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
          title="Delete block"
        >
          ×
        </button>
      </div>

      {/* Block-specific editor */}
      {block.type === 'heading' && <HeadingEditor block={block} onChange={onChange} />}
      {block.type === 'text' && <TextEditor block={block} onChange={onChange} onPickImage={onPickImage} />}
      {block.type === 'image' && <ImageEditor block={block} onChange={onChange} onPickImage={onPickImage} />}
      {block.type === 'divider' && <DividerEditor block={block} onChange={onChange} />}
      {block.type === 'button' && <ButtonEditor block={block} onChange={onChange} />}
      {block.type === 'spacer' && <SpacerEditor block={block} onChange={onChange} />}
      {block.type === 'code' && <CodeEditor block={block} onChange={onChange} />}
    </div>
  )
}

// ─── Add block menu ───────────────────────────────────────────────────────────

function AddBlockMenu({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const BLOCK_TYPES: { type: BlockType; icon: string; label: string }[] = [
    { type: 'heading', icon: 'H', label: 'Heading' },
    { type: 'text', icon: '¶', label: 'Text' },
    { type: 'image', icon: '🖼', label: 'Image' },
    { type: 'divider', icon: '─', label: 'Divider' },
    { type: 'button', icon: '⬜', label: 'Button' },
    { type: 'spacer', icon: '↕', label: 'Spacer' },
    { type: 'code', icon: '<>', label: 'Code' },
  ]

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: '8px 16px',
          background: '#111',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        + Add block
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            padding: 6,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 4,
            zIndex: 50,
            minWidth: 220,
          }}
        >
          {BLOCK_TYPES.map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => { onAdd(type); setOpen(false) }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 8px',
                background: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 11,
                color: '#374151',
              }}
            >
              <span style={{ fontSize: 18 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main BlockEditor ─────────────────────────────────────────────────────────

export function BlockEditor({
  blocks,
  onChange,
  onPickImage,
}: {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
  onPickImage?: () => Promise<string | null>
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id)
      const newIndex = blocks.findIndex((b) => b.id === over.id)
      onChange(arrayMove(blocks, oldIndex, newIndex))
    }
  }

  const addBlock = (type: BlockType) => {
    onChange([...blocks, makeBlock(type)])
  }

  const updateBlock = (updated: Block) => {
    onChange(blocks.map((b) => (b.id === updated.id ? updated : b)))
  }

  const deleteBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id))
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block) => (
            <BlockRow
              key={block.id}
              block={block}
              onChange={updateBlock}
              onDelete={() => deleteBlock(block.id)}
              onPickImage={onPickImage}
            />
          ))}
        </SortableContext>
      </DndContext>

      {blocks.length === 0 && (
        <div
          style={{
            border: '2px dashed #e5e7eb',
            borderRadius: 8,
            padding: 40,
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          No blocks yet — add one below
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <AddBlockMenu onAdd={addBlock} />
      </div>
    </div>
  )
}
