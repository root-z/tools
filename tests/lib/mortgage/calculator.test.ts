import { describe, expect, it } from 'vitest';
import { calculateMonthlyPayment, calculateMortgageSummary } from '$lib';

describe('calculateMonthlyPayment', () => {
  it('computes the standard amortized payment for a fixed-rate loan', () => {
    const payment = calculateMonthlyPayment(300_000, 5, 30);
    expect(payment).toBeCloseTo(1610.46, 2);
  });

  it('handles zero interest loans by evenly distributing principal', () => {
    const payment = calculateMonthlyPayment(120_000, 0, 15);
    expect(payment).toBeCloseTo(666.67, 2);
  });
});

describe('calculateMortgageSummary', () => {
  it('produces an amortization schedule with a zero balance at payoff', () => {
    const summary = calculateMortgageSummary({
      principal: 250_000,
      annualInterestRate: 4,
      termYears: 30
    });

    expect(summary.payoffMonths).toBe(360);
    expect(summary.schedule.at(-1)?.remainingBalance).toBe(0);
    expect(summary.totalInterest).toBeGreaterThan(0);
  });

  it('reduces payoff time and interest when extra monthly payments are applied', () => {
    const withExtra = calculateMortgageSummary({
      principal: 250_000,
      annualInterestRate: 4,
      termYears: 30,
      extraMonthlyPayment: 200
    });

    const baseline = calculateMortgageSummary({
      principal: 250_000,
      annualInterestRate: 4,
      termYears: 30
    });

    expect(withExtra.payoffMonths).toBeLessThan(baseline.payoffMonths);
    expect(withExtra.totalInterest).toBeLessThan(baseline.totalInterest);
    expect(withExtra.schedule.at(-1)?.remainingBalance).toBe(0);
  });

  it('preserves totals for zero interest, extra payment scenarios', () => {
    const summary = calculateMortgageSummary({
      principal: 60_000,
      annualInterestRate: 0,
      termYears: 10,
      extraMonthlyPayment: 100
    });

    const finalRow = summary.schedule.at(-1);

    expect(summary.monthlyPayment).toBeCloseTo(500, 2);
    expect(summary.totalInterest).toBe(0);
    expect(finalRow?.remainingBalance).toBe(0);
    expect(summary.payoffMonths).toBeLessThanOrEqual(120);
  });
});
