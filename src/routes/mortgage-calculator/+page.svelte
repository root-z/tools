<script lang="ts">
  import { calculateMortgageSummary } from '$lib';
  import type { MortgageInput, MortgageSummary } from '$lib/types';

  type FieldValue = string | number;

  interface MortgageForm {
    principal: FieldValue;
    annualInterestRate: FieldValue;
    termYears: FieldValue;
    extraMonthlyPayment: FieldValue;
  }

  type FormErrors = Partial<Record<keyof MortgageForm, string>>;

  const initialForm: MortgageForm = {
    principal: '',
    annualInterestRate: '',
    termYears: '',
    extraMonthlyPayment: ''
  };

  let form: MortgageForm = { ...initialForm };
  let errors: FormErrors = {};
  let summary: MortgageSummary | null = null;
  let showSchedule = false;

  const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const hasValue = (value: FieldValue) => String(value ?? '').trim().length > 0;

  $: canSubmit = hasValue(form.principal) && hasValue(form.annualInterestRate) && hasValue(form.termYears);

  function parseForm(): MortgageInput | null {
    const nextErrors: FormErrors = {};
    const principal = Number(form.principal);
    const annualInterestRate = Number(form.annualInterestRate);
    const termYears = Number(form.termYears);
    const extraMonthlyPayment = hasValue(form.extraMonthlyPayment) ? Number(form.extraMonthlyPayment) : 0;

    if (!Number.isFinite(principal) || principal <= 0) {
      nextErrors.principal = 'Enter a loan amount greater than 0';
    }

    if (!Number.isFinite(annualInterestRate) || annualInterestRate < 0) {
      nextErrors.annualInterestRate = 'Interest rate cannot be negative';
    }

    if (!Number.isFinite(termYears) || termYears <= 0) {
      nextErrors.termYears = 'Loan term must be greater than 0';
    }

    if (!Number.isFinite(extraMonthlyPayment) || extraMonthlyPayment < 0) {
      nextErrors.extraMonthlyPayment = 'Extra payment must be 0 or higher';
    }

    errors = nextErrors;

    if (Object.keys(nextErrors).length > 0) {
      return null;
    }

    return {
      principal,
      annualInterestRate,
      termYears,
      extraMonthlyPayment
    };
  }

  function handleSubmit() {
    const parsed = parseForm();
    if (!parsed) {
      summary = null;
      return;
    }

    summary = calculateMortgageSummary(parsed);
    showSchedule = false;
  }

  function handleReset() {
    form = { ...initialForm };
    errors = {};
    summary = null;
    showSchedule = false;
  }

  function formatCurrency(value: number) {
    return currency.format(value);
  }

  function formatDuration(months: number) {
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    const parts: string[] = [];
    if (years > 0) {
      parts.push(`${years} year${years === 1 ? '' : 's'}`);
    }
    if (remaining > 0) {
      parts.push(`${remaining} month${remaining === 1 ? '' : 's'}`);
    }
    if (parts.length === 0) {
      return '0 months';
    }
    return parts.join(' ');
  }

  function toggleSchedule() {
    showSchedule = !showSchedule;
  }
</script>

<svelte:head>
  <title>Mortgage Calculator</title>
  <meta name="description" content="Estimate monthly mortgage payments and pay-off timeline with optional extra payments." />
</svelte:head>

<div class="container py-5">
  <div class="row justify-content-center">
    <div class="col-12 col-lg-10">
      <div class="text-center mb-5">
        <h1 class="display-5">Mortgage Calculator</h1>
        <p class="lead">Enter your loan details to estimate payments and payoff timeline.</p>
      </div>

      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <form on:submit|preventDefault={handleSubmit} class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="principal">Loan amount</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input
                  id="principal"
                  class="form-control"
                  class:is-invalid={Boolean(errors.principal)}
                  type="number"
                  inputmode="decimal"
                  min="0"
                  step="0.01"
                  bind:value={form.principal}
                  aria-describedby="principal-help"
                />
                {#if errors.principal}
                  <div class="invalid-feedback">{errors.principal}</div>
                {/if}
              </div>
              <div id="principal-help" class="form-text">Total loan balance you plan to finance.</div>
            </div>

            <div class="col-md-6">
              <label class="form-label" for="interest">Annual interest rate</label>
              <div class="input-group">
                <input
                  id="interest"
                  class="form-control"
                  class:is-invalid={Boolean(errors.annualInterestRate)}
                  type="number"
                  inputmode="decimal"
                  min="0"
                  step="0.01"
                  bind:value={form.annualInterestRate}
                  aria-describedby="interest-help"
                />
                <span class="input-group-text">%</span>
                {#if errors.annualInterestRate}
                  <div class="invalid-feedback">{errors.annualInterestRate}</div>
                {/if}
              </div>
              <div id="interest-help" class="form-text">Enter the nominal annual percentage rate.</div>
            </div>

            <div class="col-md-6">
              <label class="form-label" for="term">Loan term (years)</label>
              <input
                id="term"
                class="form-control"
                class:is-invalid={Boolean(errors.termYears)}
                type="number"
                inputmode="decimal"
                min="1"
                step="0.5"
                bind:value={form.termYears}
                aria-describedby="term-help"
              />
              {#if errors.termYears}
                <div class="invalid-feedback">{errors.termYears}</div>
              {/if}
              <div id="term-help" class="form-text">Typical terms are 15 or 30 years.</div>
            </div>

            <div class="col-md-6">
              <label class="form-label" for="extra">Extra payment (monthly)</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input
                  id="extra"
                  class="form-control"
                  class:is-invalid={Boolean(errors.extraMonthlyPayment)}
                  type="number"
                  inputmode="decimal"
                  min="0"
                  step="0.01"
                  bind:value={form.extraMonthlyPayment}
                  aria-describedby="extra-help"
                />
                {#if errors.extraMonthlyPayment}
                  <div class="invalid-feedback">{errors.extraMonthlyPayment}</div>
                {/if}
              </div>
              <div id="extra-help" class="form-text">Optional additional amount you plan to pay monthly.</div>
            </div>

            <div class="col-12 d-flex gap-2 justify-content-end mt-3">
              <button type="button" class="btn btn-outline-secondary" on:click={handleReset}>Reset</button>
              <button type="submit" class="btn btn-primary" disabled={!canSubmit}>Calculate</button>
            </div>
          </form>
        </div>
      </div>

      {#if summary}
        <div class="card shadow-sm mb-4">
          <div class="card-body">
            <div class="row g-4 align-items-center">
              <div class="col-md-3">
                <h2 class="h5 text-muted mb-1">Monthly payment</h2>
                <p class="display-6 mb-0">{formatCurrency(summary.monthlyPayment + summary.extraMonthlyPayment)}</p>
                {#if summary.extraMonthlyPayment > 0}
                  <small class="text-muted d-block">Base {formatCurrency(summary.monthlyPayment)} + extra {formatCurrency(summary.extraMonthlyPayment)}</small>
                {/if}
              </div>
              <div class="col-md-3">
                <h2 class="h6 text-muted mb-1">Payoff timeline</h2>
                <p class="mb-0">{formatDuration(summary.payoffMonths)}</p>
                {#if summary.payoffMonths < summary.baselineMonths}
                  <span class="badge bg-success mt-2">
                    {summary.baselineMonths - summary.payoffMonths} months faster
                  </span>
                {/if}
              </div>
              <div class="col-md-3">
                <h2 class="h6 text-muted mb-1">Total interest</h2>
                <p class="mb-0">{formatCurrency(summary.totalInterest)}</p>
                {#if summary.interestSaved > 0}
                  <span class="badge bg-success mt-2">{formatCurrency(summary.interestSaved)} saved</span>
                {/if}
              </div>
              <div class="col-md-3">
                <h2 class="h6 text-muted mb-1">Total paid</h2>
                <p class="mb-0">{formatCurrency(summary.totalPaid)}</p>
                {#if summary.extraMonthlyPayment > 0}
                  <small class="text-muted">Includes {formatCurrency(summary.extraMonthlyPayment)} extra each month.</small>
                {/if}
              </div>
            </div>

            <div class="mt-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h3 class="h6 mb-0">Amortization schedule</h3>
              <button type="button" class="btn btn-outline-primary btn-sm" on:click={toggleSchedule}>
                {showSchedule ? 'Hide' : 'Show'} schedule
              </button>
            </div>

            {#if showSchedule}
              <div class="table-responsive mt-3">
                <table class="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th scope="col">Month</th>
                      <th scope="col">Payment</th>
                      <th scope="col">Principal</th>
                      <th scope="col">Extra</th>
                      <th scope="col">Interest</th>
                      <th scope="col">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each summary.schedule as row (row.month)}
                      <tr>
                        <th scope="row">{row.month}</th>
                        <td>{formatCurrency(row.totalPayment)}</td>
                        <td>{formatCurrency(row.principalPaid)}</td>
                        <td>{formatCurrency(row.extraPayment)}</td>
                        <td>{formatCurrency(row.interestPaid)}</td>
                        <td>{formatCurrency(row.remainingBalance)}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .card {
    border: none;
  }

  .card.shadow-sm {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.05);
  }

  .display-6 {
    font-size: clamp(2rem, 3vw, 2.5rem);
  }

  .table-responsive {
    max-height: 420px;
  }
</style>
