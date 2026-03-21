import { pgTable, text, timestamp, uuid, real, integer, boolean, jsonb, unique } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

// Raw location pings from OwnTracks
export const locationPings = pgTable('location_pings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  lat: real('lat').notNull(),
  lon: real('lon').notNull(),
  accuracyM: real('accuracy_m'),
  velocityMs: real('velocity_ms'),  // metres per second from OwnTracks
  altitudeM: real('altitude_m'),
  batteryPct: integer('battery_pct'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(), // from OwnTracks tst
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  processed: boolean('processed').notNull().default(false),
})

export type LocationPing = typeof locationPings.$inferSelect
export type NewLocationPing = typeof locationPings.$inferInsert

// Named places (home, work, gym, etc.)
export const knownPlaces = pgTable(
  'known_places',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    lat: real('lat').notNull(),
    lon: real('lon').notNull(),
    radiusM: integer('radius_m').notNull().default(100), // match threshold
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ tenantNameUniq: unique().on(t.tenantId, t.name) })
)

export type KnownPlace = typeof knownPlaces.$inferSelect
export type NewKnownPlace = typeof knownPlaces.$inferInsert

// Named routes with personal performance stats
export const knownRoutes = pgTable('known_routes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),                  // e.g. "Home → Work"
  originLat: real('origin_lat').notNull(),
  originLon: real('origin_lon').notNull(),
  destLat: real('dest_lat').notNull(),
  destLon: real('dest_lon').notNull(),
  typicalDurationS: integer('typical_duration_s'), // rolling avg of actual durations
  personalRatio: real('personal_ratio'),           // actual ÷ TfL estimate (e.g. 0.88)
  journeyCount: integer('journey_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type KnownRoute = typeof knownRoutes.$inferSelect
export type NewKnownRoute = typeof knownRoutes.$inferInsert

// Detected journeys — one per trip
export const journeys = pgTable('journeys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }).notNull(),
  originLat: real('origin_lat').notNull(),
  originLon: real('origin_lon').notNull(),
  destLat: real('dest_lat').notNull(),
  destLon: real('dest_lon').notNull(),
  originName: text('origin_name'),               // matched known place name, if any
  destName: text('dest_name'),
  distanceM: integer('distance_m').notNull(),
  durationS: integer('duration_s').notNull(),
  mode: text('mode').notNull().default('unknown'), // walking|cycling|transit|mixed|unknown
  routeId: uuid('route_id').references(() => knownRoutes.id, { onDelete: 'set null' }),
  tflEstimatedS: integer('tfl_estimated_s'),      // TfL journey planner result
  tflRoute: jsonb('tfl_route'),                   // raw TfL legs/lines
  weatherSummary: jsonb('weather_summary'),        // Open-Meteo snapshot
  pingCount: integer('ping_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Journey = typeof journeys.$inferSelect
export type NewJourney = typeof journeys.$inferInsert
