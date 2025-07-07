import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ActivityTracker from '$lib/components/ActivityTracker.svelte';
import * as store from '$lib/store';
import { writable } from 'svelte/store';
import type { Activities } from '$lib/types';

// Setup store mocks before component imports them
const mockActivities = writable<Activities>([]);
vi.spyOn(store, 'activities', 'get').mockReturnValue(mockActivities);
vi.spyOn(store, 'startActivity').mockImplementation(vi.fn());
vi.spyOn(store, 'stopActivity').mockImplementation(vi.fn());

describe('ActivityTracker.svelte', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActivities.set([]);
  });

  it('should render the form with input and start button when no active activity', async () => {
    const { getByPlaceholderText, getByText } = render(ActivityTracker);
    
    const input = getByPlaceholderText('What are you working on?');
    const startButton = getByText('Start');
    
    expect(input).not.toBeDisabled();
    expect(startButton).toBeInTheDocument();
    expect(startButton).toBeDisabled(); // Button should be disabled when input is empty
  });

  it('should enable the start button when activity name is entered', async () => {
    const { getByPlaceholderText, getByText } = render(ActivityTracker);
    
    const input = getByPlaceholderText('What are you working on?');
    const startButton = getByText('Start');
    
    // Type in the input
    await fireEvent.input(input, { target: { value: 'New Activity' } });
    
    expect(startButton).not.toBeDisabled();
  });

  it('should call startActivity when form is submitted', async () => {
    const { getByPlaceholderText, getByText } = render(ActivityTracker);
    
    const input = getByPlaceholderText('What are you working on?');
    
    // Type in the input and submit the form
    await fireEvent.input(input, { target: { value: 'New Activity' } });
    const startButton = getByText('Start');
    await fireEvent.click(startButton);
    
    expect(store.startActivity).toHaveBeenCalledWith('New Activity');
  });

  it('should show active activity with timer when an activity is active', () => {
    // Set up an active activity
    mockActivities.set([{
      id: '123',
      name: 'Active Task',
      startTime: Date.now(),
      isActive: true
    }]);
    
    const { getByPlaceholderText, getByText } = render(ActivityTracker);
    
    // Input should be disabled
    const input = getByPlaceholderText('What are you working on?');
    expect(input).toBeDisabled();
    
    // Stop button should be visible
    const stopButton = getByText('Stop');
    expect(stopButton).toBeInTheDocument();
    
    // Active activity should be displayed
    const activityName = getByText('Active Task');
    expect(activityName).toBeInTheDocument();
  });

  it('should call stopActivity when stop button is clicked', async () => {
    // Set up an active activity
    mockActivities.set([{
      id: '123',
      name: 'Active Task',
      startTime: Date.now(),
      isActive: true
    }]);
    
    const { getByText } = render(ActivityTracker);
    
    const stopButton = getByText('Stop');
    await fireEvent.click(stopButton);
    
    expect(store.stopActivity).toHaveBeenCalledWith('123');
  });
});