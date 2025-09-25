<script lang="ts">
  import GolfScorecard from '$lib/components/GolfScorecard.svelte';
</script>

<div class="container py-5">
  <div class="row justify-content-center">
    <div class="col-12 col-lg-10">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 class="display-5 mb-1">Golf Scorecard</h1>
          <p class="lead mb-0">Track par, strokes, and running totals for every hole.</p>
        </div>
        <a href="/" class="btn btn-outline-primary">
          <i class="bi bi-arrow-left me-2"></i>Back to Tools
        </a>
      </div>

      <GolfScorecard />
    </div>
  </div>
</div>
