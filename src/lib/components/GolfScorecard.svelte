<script lang="ts">
  import {
    scorecard,
    setCourseName,
    setPlayerName,
    updateHolePar,
    updatePlayerStrokes,
    addHole,
    removeHole,
    addPlayer,
    removePlayer,
    resetScorecard
  } from '$lib/scorecard';

  $: totalPar = $scorecard.holes.reduce((total, hole) => total + hole.par, 0);
  $: canAddHole = $scorecard.holes.length < 18;
  $: canRemoveHole = $scorecard.holes.length > 1;
  $: canAddPlayer = $scorecard.players.length < 6;
  $: canRemovePlayer = $scorecard.players.length > 1;
  $: playerSummaries = $scorecard.players.map((player, index) => {
    const total = player.strokes.reduce((sum, strokes) => sum + strokes, 0);
    const relative = total - totalPar;
    const label = player.name || `Player ${index + 1}`;

    return {
      id: player.id,
      label,
      total,
      relative,
      relativeLabel: relative === 0 ? 'E' : relative > 0 ? `+${relative}` : `${relative}`
    };
  });

  const handleCourseNameInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    setCourseName(target.value);
  };

  const handlePlayerNameInput = (playerId: string, event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    setPlayerName(playerId, target.value);
  };

  const onParChange = (index: number, event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    updateHolePar(index, Number(target.value));
  };

  const onStrokesChange = (playerId: string, holeIndex: number, event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    updatePlayerStrokes(playerId, holeIndex, Number(target.value));
  };
</script>

<div class="card shadow-sm">
  <div class="card-body">
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <label for="course-name" class="form-label">Course Name</label>
        <input
          id="course-name"
          type="text"
          class="form-control"
          placeholder="e.g. Pebble Beach"
          value={$scorecard.courseName}
          on:input={handleCourseNameInput}
        />
      </div>
      <div class="col-md-6">
        <label class="form-label">Course Par</label>
        <div class="summary-badge">
          <span class="label">Par Total</span>
          <span class="value">{totalPar}</span>
        </div>
      </div>
    </div>

    <div class="players-section mb-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h2 class="h5 mb-1">Players</h2>
          <p class="text-muted mb-0">Rename players and adjust the roster as needed.</p>
        </div>
        <button class="btn btn-outline-success" type="button" on:click={() => addPlayer()} disabled={!canAddPlayer}>
          <i class="bi bi-person-plus me-2"></i>Add Player
        </button>
      </div>

      <div class="row g-3">
        {#each $scorecard.players as player, index (player.id)}
          <div class="col-12 col-md-6">
            <div class="input-group">
              <span class="input-group-text">{index + 1}</span>
              <input
                type="text"
                class="form-control"
                placeholder={`Player ${index + 1}`}
                value={player.name}
                on:input={(event) => handlePlayerNameInput(player.id, event)}
              />
              <button
                type="button"
                class="btn btn-outline-danger"
                on:click={() => removePlayer(player.id)}
                disabled={!canRemovePlayer}
                aria-label={`Remove ${player.name || `Player ${index + 1}`}`}
              >
                <i class="bi bi-person-dash"></i>
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="table-responsive mb-4">
      <table class="table align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th scope="col">Hole</th>
            <th scope="col">Par</th>
            {#each $scorecard.players as player, index (player.id)}
              <th scope="col" class="text-center">{player.name || `Player ${index + 1}`}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each $scorecard.holes as hole, holeIndex}
            <tr>
              <th scope="row">{hole.number}</th>
              <td>
                <input
                  type="number"
                  min="1"
                  max="8"
                  class="form-control form-control-sm"
                  value={hole.par}
                  on:input={(event) => onParChange(holeIndex, event)}
                />
              </td>
              {#each $scorecard.players as player (player.id)}
                <td>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    class="form-control form-control-sm text-center"
                    value={player.strokes[holeIndex] ?? 0}
                    on:input={(event) => onStrokesChange(player.id, holeIndex, event)}
                  />
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="row g-3 mb-4">
      {#each playerSummaries as summary}
        <div class="col-12 col-md-4 col-lg-3">
          <div class="player-summary" data-relative={summary.relative}>
            <span class="summary-name">{summary.label}</span>
            <div class="summary-totals">
              <span class="summary-total">{summary.total}</span>
              <span class="summary-relative">{summary.relativeLabel}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center">
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary" type="button" on:click={addHole} disabled={!canAddHole}>
          <i class="bi bi-plus-circle me-2"></i>Add Hole
        </button>
        <button class="btn btn-outline-secondary" type="button" on:click={removeHole} disabled={!canRemoveHole}>
          <i class="bi bi-dash-circle me-2"></i>Remove Last Hole
        </button>
      </div>
      <button class="btn btn-outline-danger" type="button" on:click={resetScorecard}>
        <i class="bi bi-arrow-counterclockwise me-2"></i>Reset Card
      </button>
    </div>
  </div>
</div>

<style>
  .summary-badge {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 120px;
    min-height: 72px;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background: rgba(var(--bs-primary-rgb), 0.08);
  }

  .summary-badge .label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--bs-secondary-color);
  }

  .summary-badge .value {
    font-size: 1.5rem;
    font-weight: 600;
  }

  .player-summary {
    border: 1px solid rgba(var(--bs-primary-rgb), 0.2);
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: rgba(var(--bs-primary-rgb), 0.05);
  }

  .player-summary[data-relative^="-"] {
    background: rgba(var(--bs-success-rgb), 0.1);
  }

  .player-summary[data-relative="0"] {
    background: rgba(var(--bs-primary-rgb), 0.08);
  }

  .player-summary[data-relative^="+"] {
    background: rgba(var(--bs-warning-rgb), 0.18);
  }

  .summary-name {
    font-weight: 600;
  }

  .summary-totals {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .summary-total {
    font-size: 1.75rem;
    font-weight: 700;
  }

  .summary-relative {
    font-size: 1rem;
    font-weight: 600;
    color: var(--bs-secondary-color);
  }

  @media (max-width: 576px) {
    .summary-badge {
      width: 100%;
    }

    .player-summary {
      width: 100%;
    }
  }
</style>
