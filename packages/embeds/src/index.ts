// Web component wrappers for external embedding
import r2wc from '@r2wc/react-to-web-component'
import { JournalWidget } from './JournalWidget'
import { JournalEntryWidget } from './JournalEntryWidget'

// Feed of all published entries — click any card to expand full content
const JournalWebComponent = r2wc(JournalWidget, {
  props: { token: 'string', apiUrl: 'string' },
})
customElements.define('journal-widget', JournalWebComponent)

// Single entry embed — requires entry-id attribute
const JournalEntryWebComponent = r2wc(JournalEntryWidget, {
  props: { token: 'string', entryId: 'string', apiUrl: 'string' },
})
customElements.define('journal-entry', JournalEntryWebComponent)
