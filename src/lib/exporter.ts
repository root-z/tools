import type { Activities } from './types';
import { formatDuration } from './store';

/**
 * Converts activities array to CSV format
 * @param activities - Array of activities to convert
 * @returns CSV string with headers and activity data
 */
export function activitiesToCSV(activities: Activities): string {
  // Define CSV headers
  const headers = ['Activity Name', 'Start Time', 'End Time', 'Duration', 'Status'];
  
  // Map activities to CSV rows
  const rows = activities.map(activity => {
    const startTime = new Date(activity.startTime).toLocaleString();
    const endTime = activity.endTime ? new Date(activity.endTime).toLocaleString() : 'N/A';
    // Handle possibly undefined duration
    const duration = activity.isActive 
      ? 'In progress' 
      : (activity.duration ? formatDuration(activity.duration) : 'Unknown');
    const status = activity.isActive ? 'Active' : 'Completed';
    
    return [
      // Escape quotes in the activity name
      `"${activity.name.replace(/"/g, '""')}"`,
      startTime,
      endTime,
      duration,
      status
    ];
  });
  
  // Combine headers and rows
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csv;
}

/**
 * Creates and triggers a file download
 * @param filename - Name of the file to download
 * @param content - Content of the file
 * @param type - MIME type of the file
 */
export function downloadFile(filename: string, content: string, type: string = 'text/plain'): void {
  // Create a blob with the content
  const blob = new Blob([content], { type });
  
  // Create an object URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a download link
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to the document, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the object URL
  URL.revokeObjectURL(url);
}