import { afterEach, describe, expect, it, vi } from 'vitest';
import { prepareOffline } from '../../src/infrastructure/offline/register';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('offline setup', () => {
  it('does not register a service worker in development', async () => {
    expect(await prepareOffline(false)).toBe('development');
  });
  it('reports unsupported browsers honestly', async () => {
    vi.stubGlobal('navigator', {});
    expect(await prepareOffline(true)).toBe('unavailable');
  });
  it('reports registration failures', async () => {
    vi.stubGlobal('navigator', {
      serviceWorker: {
        register: vi.fn().mockRejectedValue(new Error('Denied')),
      },
    });
    expect(await prepareOffline(true)).toBe('unavailable');
  });
  it('waits for the precached worker to become ready', async () => {
    const register = vi.fn().mockResolvedValue({});
    vi.stubGlobal('navigator', {
      serviceWorker: { register, ready: Promise.resolve({}) },
    });
    expect(await prepareOffline(true)).toBe('ready');
    expect(register).toHaveBeenCalledWith('/sw.js');
  });
  it('reports a stalled installation instead of checking forever', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', {
      serviceWorker: {
        register: vi.fn().mockResolvedValue({}),
        ready: new Promise(() => undefined),
      },
    });
    const result = prepareOffline(true);
    await vi.advanceTimersByTimeAsync(15000);
    expect(await result).toBe('unavailable');
  });
});
