// Web component wrappers for external embedding
import r2wc from '@r2wc/react-to-web-component'
import { JournalWidget } from './JournalWidget'
import { JournalEntryWidget } from './JournalEntryWidget'
import { CMSPageWidget } from './CMSPageWidget'
import { CMSPagesWidget } from './CMSPagesWidget'
import { SpotifyNowPlayingWidget } from './SpotifyNowPlayingWidget'
import { SpotifyTopTracksWidget } from './SpotifyTopTracksWidget'
import { SpotifyGenreChartWidget } from './SpotifyGenreChartWidget'

// Feed of all published journal entries — click any card to expand full content
const JournalWebComponent = r2wc(JournalWidget, {
  props: { token: 'string', apiUrl: 'string' },
})
customElements.define('journal-widget', JournalWebComponent)

// Single journal entry embed — requires entry-id attribute
const JournalEntryWebComponent = r2wc(JournalEntryWidget, {
  props: { token: 'string', entryId: 'string', apiUrl: 'string' },
})
customElements.define('journal-entry', JournalEntryWebComponent)

// Single CMS page embed — fetches and renders one published page by slug
const CMSPageWebComponent = r2wc(CMSPageWidget, {
  props: { token: 'string', slug: 'string', apiUrl: 'string', showTitle: 'boolean' },
})
customElements.define('cms-page', CMSPageWebComponent)

// List of all published CMS pages — expandable cards
const CMSPagesWebComponent = r2wc(CMSPagesWidget, {
  props: { token: 'string', apiUrl: 'string' },
})
customElements.define('cms-pages', CMSPagesWebComponent)

// Spotify: last played / now playing
const SpotifyNowPlayingWebComponent = r2wc(SpotifyNowPlayingWidget, {
  props: { token: 'string', apiUrl: 'string' },
})
customElements.define('spotify-now-playing', SpotifyNowPlayingWebComponent)

// Spotify: top 5 tracks (short-term)
const SpotifyTopTracksWebComponent = r2wc(SpotifyTopTracksWidget, {
  props: { token: 'string', apiUrl: 'string' },
})
customElements.define('spotify-top-tracks', SpotifyTopTracksWebComponent)

// Spotify: genre frequency bar chart (CSS-based, no D3)
const SpotifyGenreChartWebComponent = r2wc(SpotifyGenreChartWidget, {
  props: { token: 'string', apiUrl: 'string' },
})
customElements.define('spotify-genre-chart', SpotifyGenreChartWebComponent)
