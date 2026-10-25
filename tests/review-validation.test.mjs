import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isIsoDate, isSafeCitation } from '../scripts/formula-review-validation.mjs';

test('review dates must be real ISO calendar dates', () => {
  assert.equal(isIsoDate('2024-02-29'), true);
  assert.equal(isIsoDate('2025-02-29'), false);
  assert.equal(isIsoDate('2024-02-31'), false);
  assert.equal(isIsoDate('not-a-date'), false);
  assert.equal(isIsoDate(null), false);
});

test('citations require a title and credential-free HTTPS URL', () => {
  assert.equal(isSafeCitation({ title: 'A source', url: 'https://example.org/book', accessed_at: '2026-10-25' }), true);
  assert.equal(isSafeCitation({ title: 'A source', url: 'http://example.org/book' }), false);
  assert.equal(isSafeCitation({ title: 'A source', url: 'javascript:alert(1)' }), false);
  assert.equal(isSafeCitation({ title: 'A source', url: 'https://user:pass@example.org/book' }), false);
  assert.equal(isSafeCitation({ title: ' ', url: 'https://example.org/book' }), false);
  assert.equal(isSafeCitation({ title: 'A source', url: 'https://example.org/book', accessed_at: '2025-02-29' }), false);
  assert.equal(isSafeCitation(null), false);
});
