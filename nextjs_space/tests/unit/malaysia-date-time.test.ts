import test from 'node:test';
import assert from 'node:assert/strict';

import { formatMalaysiaDateTime } from '../../app/_components/malaysia-date-time';

test('formatMalaysiaDateTime: formats a fixed instant in Malaysia time', () => {
  const date = new Date('2026-08-12T09:41:59Z');

  assert.equal(formatMalaysiaDateTime(date), '12 Aug 2026, 5:41:59 pm');
});