import { pgTable, text, timestamp, uuid, jsonb, unique } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

// One per tenant — stores their own Spotify developer app credentials + OAuth tokens
export const spotifyConnections = pgTable('spotify_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }).unique(),
  clientId: text('client_id').notNull(),
  clientSecret: text('client_secret').notNull(),
  redirectUri: text('redirect_uri'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  spotifyUserId: text('spotify_user_id'),
  spotifyDisplayName: text('spotify_display_name'),
  oauthState: text('oauth_state'), // temp CSRF token for OAuth flow
  connectedAt: timestamp('connected_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type SpotifyConnection = typeof spotifyConnections.$inferSelect
export type NewSpotifyConnection = typeof spotifyConnections.$inferInsert

// Synced data snapshots — one row per tenant+dataType, upserted on each sync
// dataType: 'top_tracks_short' | 'top_tracks_medium' | 'top_tracks_long'
//         | 'top_artists_short' | 'top_artists_medium' | 'top_artists_long'
//         | 'recently_played' | 'audio_features'
export const spotifyDataCache = pgTable(
  'spotify_data_cache',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    dataType: text('data_type').notNull(),
    data: jsonb('data').notNull().default([]),
    syncedAt: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ tenantTypeUniq: unique().on(t.tenantId, t.dataType) })
)

export type SpotifyDataCache = typeof spotifyDataCache.$inferSelect
