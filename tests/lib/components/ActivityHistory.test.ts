import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ActivityHistory from '$lib/components/ActivityHistory.svelte';
import * as store from '$lib/store';
import { writable } from 'svelte/store';
import type { Activities } from '$lib/types';

// Setup store mocks before component imports them
const mockActivities = writable<Activities>([]);
vi.spyOn(store, 'activities', 'get').mockReturnValue(mockActivities);
vi.spyOn(store, 'formatDuration').mockImplementation(ms => `formatted:${ms}`);
vi.spyOn(store, 'deleteActivity').mockImplementation(vi.fn());
vi.spyOn(store, 'clearActivities').mockImplementation(vi.fn());

describe('ActivityHistory.svelte', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActivities.set([]);
  });

  it('should display a message when no activities exist', () => {
    const { getByText } = render(ActivityHistory);
    
    expect(getByText('No activities recorded yet.')).toBeInTheDocument();
  });

  it('should render a table with activity history', () => {
    // Set up some activities
    const now = 1684939816000; // Fixed timestamp
    mockActivities.set([
      {
        id: '1',
        name: 'Completed Activity',
        startTime: now - 60000,
        endTime: now,
        duration: 60000,
        isActive: false
      },
      {
        id: '2',
        name: 'Active Activity',
        startTime: now,
        isActive: true
      }
    ]);
    
    const { getAllByRole, getByText } = render(ActivityHistory);
    
    // Check table headers
    const headers = getAllByRole('columnheader');
    expect(headers[0].textContent).toBe('Activity');
    expect(headers[1].textContent).toBe('Started');
    expect(headers[2].textContent).toBe('Ended');
    expect(headers[3].textContent).toBe('Duration');
    
    // Check activity names in first column
    expect(getByText('Active Activity')).toBeInTheDocument();
    expect(getByText('Completed Activity')).toBeInTheDocument();
    
    // Check end status
    expect(getByText('In progress')).toBeInTheDocument();
    
    // formatDuration should be called for completed activity
    expect(store.formatDuration).toHaveBeenCalledWith(60000);
  });

  it('should display activities in reverse chronological order', () => {
    // Set up some activities in chronological order
    const now = 1684939816000; // Fixed timestamp
    mockActivities.set([
      {
        id: '1',
        name: 'First Activity',
        startTime: now - 3600000,
        endTime: now - 3540000,
        duration: 60000,
        isActive: false
      },
      {
        id: '2',
        name: 'Second Activity',
        startTime: now - 1800000,
        endTime: now - 1740000,
        duration: 60000,
        isActive: false
      },
      {
        id: '3',
        name: 'Third Activity',
        startTime: now,
        isActive: true
      }
    ]);
    
    const { getAllByRole } = render(ActivityHistory);
    
    // Get all rows (including header row)
    const rows = getAllByRole('row');
    
    // First row is header
    // Second row should be Third Activity (most recent)
    // Third row should be Second Activity
    // Fourth row should be First Activity (oldest)
    expect(rows[1].textContent).toContain('Third Activity');
    expect(rows[2].textContent).toContain('Second Activity');
    expect(rows[3].textContent).toContain('First Activity');
  });

  it('should show delete buttons for completed activities only', () => {
    // Set up activities with one active and one completed
    const now = 1684939816000;
    mockActivities.set([
      {
        id: '1',
        name: 'Completed Activity',
        startTime: now - 60000,
        endTime: now,
        duration: 60000,
        isActive: false
      },
      {
        id: '2',
        name: 'Active Activity',
        startTime: now,
        isActive: true
      }
    ]);

    const { getAllByText, getAllByRole } = render(ActivityHistory);
    const deleteButtons = getAllByText('Delete');
    
    // Should have two delete buttons, one for each activity
    expect(deleteButtons.length).toBe(2);
    
    // The delete button for active activity should be disabled
    const rows = getAllByRole('row');
    const activeRow = rows.find(row => row.textContent?.includes('Active Activity'));
    const activeRowDeleteButton = activeRow?.querySelector('button');
    expect(activeRowDeleteButton).toBeDisabled();
    
    // The delete button for completed activity should be enabled
    const completedRow = rows.find(row => row.textContent?.includes('Completed Activity'));
    const completedRowDeleteButton = completedRow?.querySelector('button');
    expect(completedRowDeleteButton).not.toBeDisabled();
  });

  it('should call deleteActivity when delete button is clicked', async () => {
    // Mock the confirm method to always return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    // Set up a completed activity
    mockActivities.set([
      {
        id: '123',
        name: 'Test Activity',
        startTime: 1684939816000,
        endTime: 1684939876000,
        duration: 60000,
        isActive: false
      }
    ]);

    const { getByText } = render(ActivityHistory);
    const deleteButton = getByText('Delete');
    
    // Click the delete button
    await fireEvent.click(deleteButton);
    
    // Confirm dialog should be shown
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this activity?');
    
    // deleteActivity should be called with the activity id
    expect(store.deleteActivity).toHaveBeenCalledWith('123');
    
    confirmSpy.mockRestore();
  });

  it('should show clear all button when activities exist', () => {
    // Set up an activity
    mockActivities.set([
      {
        id: '1',
        name: 'Test Activity',
        startTime: 1684939816000,
        endTime: 1684939876000,
        duration: 60000,
        isActive: false
      }
    ]);

    const { getByText } = render(ActivityHistory);
    const clearButton = getByText('Clear All');
    
    expect(clearButton).toBeInTheDocument();
  });

  it('should not show clear all button when no activities exist', () => {
    mockActivities.set([]);

    const { queryByText } = render(ActivityHistory);
    const clearButton = queryByText('Clear All');
    
    expect(clearButton).not.toBeInTheDocument();
  });

  it('should call clearActivities when clear all button is clicked', async () => {
    // Mock the confirm method to always return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    // Set up an activity
    mockActivities.set([
      {
        id: '1',
        name: 'Test Activity',
        startTime: 1684939816000,
        endTime: 1684939876000,
        duration: 60000,
        isActive: false
      }
    ]);

    const { getByText } = render(ActivityHistory);
    const clearButton = getByText('Clear All');
    
    // Click the clear button
    await fireEvent.click(clearButton);
    
    // Confirm dialog should be shown
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete ALL activities? This cannot be undone.');
    
    // clearActivities should be called
    expect(store.clearActivities).toHaveBeenCalled();
    
    confirmSpy.mockRestore();
  });
});