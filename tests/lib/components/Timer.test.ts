import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import Timer from '$lib/components/Timer.svelte';
import { tick } from 'svelte';
import * as store from '$lib/store';

describe('Timer.svelte', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should display the formatted time', () => {
    const formatDurationSpy = vi.spyOn(store, 'formatDuration')
      .mockImplementation((ms: number) => `formatted:${ms}`);
    
    // Set the starting time to 5 minutes ago
    const now = 1000000000000; // Fixed timestamp
    const startTime = now - 5 * 60 * 1000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    render(Timer, { props: { startTime, isRunning: true } });

    // Should call formatDuration with the elapsed time (5 minutes)
    expect(formatDurationSpy).toHaveBeenCalledWith(5 * 60 * 1000);
  });

  it('should update the timer when running', async () => {
    const formatDurationSpy = vi.spyOn(store, 'formatDuration')
      .mockImplementation((ms: number) => `formatted:${ms}`);
    
    const now = 1000000000000; // Fixed timestamp
    const startTime = now;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    render(Timer, { props: { startTime, isRunning: true } });

    // Advance time by 1 second and update Date.now mock
    const nowPlus1s = now + 1000;
    vi.spyOn(Date, 'now').mockReturnValue(nowPlus1s);
    vi.advanceTimersByTime(1001);
    vi.runOnlyPendingTimers(); // Trigger interval callback manually
    await tick(); // Wait for Svelte to update the DOM

    // Should call formatDuration with updated elapsed time
    expect(formatDurationSpy).toHaveBeenCalled();
  });

  it('should not update when isRunning is false', () => {
    const formatDurationSpy = vi.spyOn(store, 'formatDuration')
      .mockImplementation((ms: number) => `formatted:${ms}`);
    
    const now = 1000000000000; // Fixed timestamp
    const startTime = now;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    render(Timer, { props: { startTime, isRunning: false } });

    // Clear any initial calls to formatDuration
    formatDurationSpy.mockClear();

    // Advance time by 5 seconds
    vi.advanceTimersByTime(5000);
    vi.runOnlyPendingTimers();

    // Should not call formatDuration again since timer is not running
    expect(formatDurationSpy).not.toHaveBeenCalled();
  });

  it('should clean up interval on destroy', () => {
    const startTime = Date.now();
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = render(Timer, { props: { startTime, isRunning: true } });

    // Unmount component
    unmount();

    // Should have cleared the interval
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});