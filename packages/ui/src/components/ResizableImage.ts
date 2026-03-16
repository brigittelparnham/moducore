import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ResizableImageView } from './ResizableImageView'

/**
 * Extends the base Image extension with:
 *  - `width` attribute (null = auto, '25%', '50%', '75%', '100%')
 *  - `alignment` attribute ('left' | 'center' | 'right')
 *  - React NodeView showing a floating controls bar when selected
 *
 * Serializes to plain <img> tags with data-width, data-alignment, and inline
 * styles so that PublicPageView renders them correctly without JavaScript.
 */
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-width') || null,
      },
      alignment: {
        default: 'center',
        parseHTML: (el) => el.getAttribute('data-alignment') || 'center',
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, title, width, alignment } = HTMLAttributes as {
      src: string
      alt?: string
      title?: string
      width: string | null
      alignment: string
    }

    const styles: string[] = ['display:block', 'max-width:100%', 'height:auto', 'border-radius:4px']
    if (width) styles.push(`width:${width}`)
    if (alignment === 'left') styles.push('margin-right:auto')
    else if (alignment === 'right') styles.push('margin-left:auto')
    else styles.push('margin:0 auto')

    const attrs: Record<string, string> = { src, style: styles.join(';') }
    if (alt) attrs.alt = alt
    if (title) attrs.title = title
    if (width) attrs['data-width'] = width
    if (alignment) attrs['data-alignment'] = alignment

    return ['img', attrs]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})
