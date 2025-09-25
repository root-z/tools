import { writable } from 'svelte/store';
import type { Activity, Activities } from './types';

// Load activities from localStorage
const storedActivities = typeof localStorage !== 'undefined' 
  ? localStorage.getItem('activities') 
  : null;

const initialActivities: Activities = storedActivities 
  ? JSON.parse(storedActivities)
  : [];

// Create writable store
export const activities = writable<Activities>(initialActivities);

// Save to localStorage when activities change
activities.subscribe(value => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('activities', JSON.stringify(value));
  }
});

// Activity management functions
export function startActivity(name: string): void {
  const id = crypto.randomUUID();
  const newActivity: Activity = {
    id,
    name,
    startTime: Date.now(),
    isActive: true
  };
  
  activities.update(activities => {
    // Stop any active activities
    const updatedActivities = activities.map(activity => 
      activity.isActive ? { ...activity, isActive: false, endTime: Date.now(), duration: Date.now() - activity.startTime } : activity
    );
    
    // Add new activity
    return [...updatedActivities, newActivity];
  });
}

export function stopActivity(id: string): void {
  activities.update(activities => 
    activities.map(activity => {
      if (activity.id === id && activity.isActive) {
        const endTime = Date.now();
        return { 
          ...activity, 
          isActive: false, 
          endTime, 
          duration: endTime - activity.startTime 
        };
      }
      return activity;
    })
  );
}

export function deleteActivity(id: string): void {
  activities.update(activities => activities.filter(activity => activity.id !== id));
}

export function clearActivities(): void {
  activities.set([]);
}

export function getActiveActivity(): Activity | undefined {
  let activeActivity: Activity | undefined;
  
  activities.subscribe(value => {
    activeActivity = value.find(activity => activity.isActive);
  })();
  
  return activeActivity;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
