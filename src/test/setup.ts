import '@testing-library/jest-dom/vitest';
// jsdom has no IndexedDB; this provides a real in-memory implementation so the
// local draft store is exercised for real rather than mocked.
import 'fake-indexeddb/auto';
