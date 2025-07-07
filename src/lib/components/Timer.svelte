<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { formatDuration } from '$lib/store';
  
  const { startTime, isRunning = true } = $props();
  
  let elapsed = $state(0);
  let interval: ReturnType<typeof setInterval> | undefined;
  let formattedTime = $derived.by(() => formatDuration(elapsed));
  
  function updateElapsed() {
    elapsed = Date.now() - startTime;
  }
  
  onMount(() => {
    updateElapsed();
    if (isRunning) {
      interval = setInterval(updateElapsed, 1000);
    }
  });
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
  
</script>

<span class="fw-bold font-monospace">
  {formattedTime}
</span>