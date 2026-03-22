/**
 * Global test setup.
 *
 * Runs once before all test files.  For unit tests nothing is needed —
 * they have no external dependencies.  For integration tests we check for
 * TEST_DATABASE_URL and redirect it to DATABASE_URL so `getDb()` connects
 * to the test database instead of the development one.
 */

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
}

// Provide a fallback DATABASE_URL so getDb() doesn't throw at import time
// when running unit tests without a test database.  The pool won't actually
// connect unless a query is executed (integration tests guard against that
// with the describe.skip / TEST_DATABASE_URL check).
process.env.DATABASE_URL ??= 'postgresql://moducore:moducore@localhost:5432/moducore_test_placeholder'

// Stub required env vars so the env.ts module doesn't exit the process
// when running unit tests outside of a fully configured environment.
process.env.AUTH_SECRET          ??= 'test-secret-for-unit-tests'
process.env.ENCRYPTION_KEY       ??= 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
process.env.RESEND_API_KEY       ??= 're_test_placeholder'
process.env.HABITS_HEALTH_SECRET ??= 'test-health-secret'
process.env.LOCATION_INGEST_SECRET ??= 'test-location-secret'
