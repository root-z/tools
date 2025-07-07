<script lang="ts">
  import ActivityTracker from '$lib/components/ActivityTracker.svelte';
  import ActivityHistory from '$lib/components/ActivityHistory.svelte';
</script>

<div class="container py-5">
  <div class="row justify-content-center">
    <div class="col-12 col-lg-10">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="display-5">Activity Tracker</h1>
          <p class="lead">Track and manage your time efficiently</p>
        </div>
        <a href="/" class="btn btn-outline-primary">
          <i class="bi bi-arrow-left me-2"></i>Back to Tools
        </a>
      </div>
      
      <ActivityTracker />
      
      <ActivityHistory />
    </div>
  </div>
</div>