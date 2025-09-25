<script lang="ts">
  import { onMount } from 'svelte';
  
  // Tool types definition
  interface Tool {
    id: string;
    name: string;
    description: string;
    icon: string;
  }
  
  // Available tools
  const tools: Tool[] = [
    {
      id: 'activity-tracker',
      name: 'Activity Tracker',
      description: 'Track and manage your time efficiently',
      icon: 'bi-stopwatch'
    },
    {
      id: 'golf-scorecard',
      name: 'Golf Scorecard',
      description: 'Keep par, strokes, and totals for every round',
      icon: 'bi-flag'
    }
  ];
  
  // Navigation function
  function navigateToTool(toolId: string) {
    window.location.href = `/${toolId}`;
  }
</script>

<svelte:head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
</svelte:head>

<div class="container py-5">
  <div class="row justify-content-center">
    <div class="col-12 col-lg-10">
      <div class="text-center mb-5">
        <h1 class="display-4">Tools Selection</h1>
        <p class="lead">Select a tool to get started</p>
      </div>
      
      <div class="row row-cols-1 row-cols-md-2 g-4">
        {#each tools as tool}
          <div class="col">
            <div class="card h-100" on:click={() => navigateToTool(tool.id)} role="button">
              <div class="card-body d-flex align-items-center">
                <div class="tool-icon me-3">
                  <i class="{tool.icon} fs-1"></i>
                </div>
                <div>
                  <h3 class="card-title">{tool.name}</h3>
                  <p class="card-text">{tool.description}</p>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
  }
  
  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  }
  
  .tool-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: rgba(var(--bs-primary-rgb), 0.1);
    color: var(--bs-primary);
  }
</style>
