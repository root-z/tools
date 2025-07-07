<script lang="ts">
  import { activities, startActivity, stopActivity, formatDuration } from '$lib/store';
  import type { Activity } from '$lib/types';
  import Timer from './Timer.svelte';
  
  let newActivityName = '';
  let activeActivity: Activity | undefined;
  
  $: activeActivity = $activities.find(activity => activity.isActive);
  
  function handleSubmit() {
    if (!newActivityName.trim()) return;
    
    startActivity(newActivityName);
    newActivityName = '';
  }
  
  function handleStopActivity() {
    if (activeActivity) {
      stopActivity(activeActivity.id);
    }
  }
</script>

<div class="card mb-4">
  <div class="card-body">
    <div class="mb-3">
      <form on:submit|preventDefault={handleSubmit} class="d-flex gap-2">
        <input 
          type="text"
          class="form-control"
          bind:value={newActivityName} 
          placeholder="What are you working on?"
          disabled={!!activeActivity}
        />
        {#if activeActivity}
          <button type="button" on:click={handleStopActivity} class="btn btn-danger">Stop</button>
        {:else}
          <button type="submit" disabled={!newActivityName.trim()} class="btn btn-success">Start</button>
        {/if}
      </form>
    </div>
    
    {#if activeActivity}
      <div class="alert alert-success d-flex align-items-center justify-content-between">
        <h5 class="mb-0">{activeActivity.name}</h5>
        <div class="badge bg-primary fs-6">
          <Timer startTime={activeActivity.startTime} />
        </div>
      </div>
    {/if}
  </div>
</div>

