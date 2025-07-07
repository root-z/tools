<script lang="ts">
  import { activities, formatDuration, deleteActivity, clearActivities } from '$lib/store';
  import { activitiesToCSV, downloadFile } from '../exporter';
  import Timer from './Timer.svelte';
  
  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }
  
  function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this activity?')) {
      deleteActivity(id);
    }
  }
  
  function handleClearAll() {
    if (confirm('Are you sure you want to delete ALL activities? This cannot be undone.')) {
      clearActivities();
    }
  }

  function handleExportCSV() {
    // Get current date for filename
    const date = new Date().toISOString().split('T')[0];
    const filename = `activity-history-${date}.csv`;
    
    // Convert activities to CSV and download
    const csv = activitiesToCSV($activities);
    downloadFile(filename, csv, 'text/csv');
  }
</script>

<div class="card">
  <div class="card-header d-flex justify-content-between align-items-center">
    <h4 class="mb-0">Activity History</h4>
    {#if $activities.length > 0}
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-primary" on:click={handleExportCSV}>
          <i class="bi bi-download me-1"></i>Export CSV
        </button>
        <button class="btn btn-sm btn-outline-danger" on:click={handleClearAll}>
          Clear All
        </button>
      </div>
    {/if}
  </div>
  <div class="card-body">
    {#if $activities.length === 0}
      <p class="text-muted fst-italic">No activities recorded yet.</p>
    {:else}
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead class="table-light">
            <tr>
              <th>Activity</th>
              <th>Started</th>
              <th>Ended</th>
              <th>Duration</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each [...$activities].reverse() as activity}
              <tr class={activity.isActive ? 'table-success' : ''}>
                <td><strong>{activity.name}</strong></td>
                <td>{formatDate(activity.startTime)}</td>
                <td>
                  {#if activity.isActive}
                    <span class="badge bg-success">In progress</span>
                  {:else}
                    {formatDate(activity.endTime)}
                  {/if}
                </td>
                <td>
                  {#if activity.isActive}
                    <Timer startTime={activity.startTime} />
                  {:else if activity.duration}
                    {formatDuration(activity.duration)}
                  {/if}
                </td>
                <td class="text-end">
                  <button 
                    class="btn btn-sm btn-outline-danger" 
                    on:click={() => handleDelete(activity.id)}
                    disabled={activity.isActive}
                    title={activity.isActive ? "Cannot delete active activity" : "Delete activity"}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

