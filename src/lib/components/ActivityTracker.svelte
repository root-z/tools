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
      <form on:submit|preventDefault={handleSubmit} class="tracker-form">
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
      <div class="alert alert-success active-activity">
        <h5 class="mb-0">{activeActivity.name}</h5>
        <div class="badge bg-primary fs-6 timer-badge">
          <Timer startTime={activeActivity.startTime} />
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .tracker-form {
    display: flex;
    gap: 0.75rem;
  }

  .tracker-form button {
    white-space: nowrap;
  }

  .active-activity {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .timer-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 4.5rem;
  }

  @media (max-width: 576px) {
    .tracker-form {
      flex-direction: column;
      align-items: stretch;
    }

    .tracker-form button {
      width: 100%;
    }

    .active-activity {
      flex-direction: column;
      align-items: flex-start;
    }

    .timer-badge {
      align-self: stretch;
      text-align: center;
      width: 100%;
    }
  }
</style>
