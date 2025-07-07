import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startActivity, stopActivity, deleteActivity, clearActivities, formatDuration, activities } from '$lib/store';
import { get } from 'svelte/store';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => '123e4567-e89b-12d3-a456-426614174000'
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; }
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

describe('store.ts', () => {
  beforeEach(() => {
    // Reset store before each test
    activities.set([]);
    localStorage.clear();
    vi.resetAllMocks();
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(0)).toBe('00:00:00');
      expect(formatDuration(1000)).toBe('00:00:01');
      expect(formatDuration(60000)).toBe('00:01:00');
      expect(formatDuration(3600000)).toBe('01:00:00');
      expect(formatDuration(3661000)).toBe('01:01:01');
      expect(formatDuration(86400000)).toBe('24:00:00');
    });
  });

  describe('startActivity', () => {
    it('should create a new activity', () => {
      const mockNow = 1684939816000; // Fixed timestamp
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);
      
      startActivity('Test Activity');
      
      const activityList = get(activities);
      expect(activityList.length).toBe(1);
      expect(activityList[0]).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Activity',
        startTime: mockNow,
        isActive: true
      });
    });

    it('should stop any active activity when starting a new one', () => {
      const mockNow = 1684939816000; // Fixed timestamp
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);
      
      startActivity('First Activity');
      
      // Move time forward 5 minutes
      const updatedMockNow = mockNow + 300000;
      vi.spyOn(Date, 'now').mockReturnValue(updatedMockNow);
      
      startActivity('Second Activity');
      
      const activityList = get(activities);
      expect(activityList.length).toBe(2);
      
      // First activity should be stopped
      expect(activityList[0]).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'First Activity',
        startTime: mockNow,
        isActive: false,
        endTime: updatedMockNow,
        duration: 300000 // 5 minutes in milliseconds
      });
      
      // Second activity should be active
      expect(activityList[1].isActive).toBe(true);
    });

    it('should save to localStorage when activities change', () => {
      const mockNow = 1684939816000; // Fixed timestamp
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);
      
      startActivity('Test Activity');
      
      const savedActivities = JSON.parse(localStorage.getItem('activities') || '[]');
      expect(savedActivities.length).toBe(1);
      expect(savedActivities[0].name).toBe('Test Activity');
    });
  });

  describe('stopActivity', () => {
    it('should stop an active activity', () => {
      const mockNow = 1684939816000; // Fixed timestamp
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);
      
      startActivity('Test Activity');
      const activityList = get(activities);
      const activityId = activityList[0].id;
      
      // Move time forward 10 minutes
      const updatedMockNow = mockNow + 600000;
      vi.spyOn(Date, 'now').mockReturnValue(updatedMockNow);
      
      stopActivity(activityId);
      
      const updatedList = get(activities);
      expect(updatedList[0]).toEqual({
        id: activityId,
        name: 'Test Activity',
        startTime: mockNow,
        isActive: false,
        endTime: updatedMockNow,
        duration: 600000 // 10 minutes in milliseconds
      });
    });

    it('should not modify inactive activities', () => {
      const mockNow = 1684939816000; // Fixed timestamp
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);
      
      startActivity('First Activity');
      
      // Move time forward and start second activity (automatically stops first)
      let updatedMockNow = mockNow + 300000;
      vi.spyOn(Date, 'now').mockReturnValue(updatedMockNow);
      startActivity('Second Activity');
      
      // Move time forward again
      updatedMockNow = updatedMockNow + 300000;
      vi.spyOn(Date, 'now').mockReturnValue(updatedMockNow);
      
      // Get first activity ID
      const activityList = get(activities);
      const firstActivityId = activityList[0].id;
      
      // Try stopping first activity (already stopped)
      stopActivity(firstActivityId);
      
      const updatedList = get(activities);
      // First activity should remain unchanged from when it was auto-stopped
      expect(updatedList[0].endTime).toBe(mockNow + 300000);
      expect(updatedList[0].duration).toBe(300000);
    });
  });

  describe('deleteActivity', () => {
    it('should delete an activity by id', () => {
      // Use a direct approach to add activities to the store for testing
      activities.set([
        {
          id: 'test-id-1',
          name: 'First Activity',
          startTime: 1000,
          isActive: false
        },
        {
          id: 'test-id-2',
          name: 'Second Activity',
          startTime: 2000,
          isActive: false
        }
      ]);
      
      const activityList = get(activities);
      expect(activityList.length).toBe(2);
      
      // Delete the first activity
      deleteActivity('test-id-1');
      
      // Should now only have one activity (the second one)
      const updatedList = get(activities);
      expect(updatedList.length).toBe(1);
      expect(updatedList[0].name).toBe('Second Activity');
    });

    it('should update localStorage after deletion', () => {
      // Set directly for more reliable testing
      activities.set([{
        id: 'test-id-3',
        name: 'Test Activity',
        startTime: 1000,
        isActive: false
      }]);
      
      // Ensure localStorage has the activity
      expect(JSON.parse(localStorage.getItem('activities') || '[]').length).toBe(1);
      
      // Delete the activity
      deleteActivity('test-id-3');
      
      // Check localStorage is updated
      const savedActivities = JSON.parse(localStorage.getItem('activities') || '[]');
      expect(savedActivities.length).toBe(0);
    });
  });

  describe('clearActivities', () => {
    it('should remove all activities', () => {
      // Set activities directly
      activities.set([
        { id: 'test-id-a', name: 'First Activity', startTime: 1000, isActive: false },
        { id: 'test-id-b', name: 'Second Activity', startTime: 2000, isActive: false },
        { id: 'test-id-c', name: 'Third Activity', startTime: 3000, isActive: true }
      ]);
      
      const activityList = get(activities);
      expect(activityList.length).toBe(3);
      
      // Clear all activities
      clearActivities();
      
      // Should have no activities left
      const updatedList = get(activities);
      expect(updatedList.length).toBe(0);
    });

    it('should update localStorage after clearing', () => {
      // Set activities directly
      activities.set([
        { id: 'test-id-d', name: 'First Activity', startTime: 1000, isActive: false },
        { id: 'test-id-e', name: 'Second Activity', startTime: 2000, isActive: false }
      ]);
      
      // Verify localStorage has 2 activities
      expect(JSON.parse(localStorage.getItem('activities') || '[]').length).toBe(2);
      
      // Clear all activities
      clearActivities();
      
      const savedActivities = JSON.parse(localStorage.getItem('activities') || '[]');
      expect(savedActivities.length).toBe(0);
    });
  });
});