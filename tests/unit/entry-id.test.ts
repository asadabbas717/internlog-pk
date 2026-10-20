import { expect, it, vi } from 'vitest';
import { createEntryId } from '../../src/infrastructure/entry-id';

it('encodes random bytes as UUID v4 and preserves the variant bits', () => {
  const random = vi.spyOn(crypto, 'getRandomValues');
  try {
    for (const byte of [0, 255]) {
      random.mockImplementationOnce((array) => {
        if (!(array instanceof Uint8Array)) throw new Error('Expected bytes');
        array.fill(byte);
        return array;
      });
      expect(createEntryId()).toBe(
        byte === 0
          ? '00000000-0000-4000-8000-000000000000'
          : 'ffffffff-ffff-4fff-bfff-ffffffffffff',
      );
    }
  } finally {
    random.mockRestore();
  }
});
