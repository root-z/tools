import type { AmortizationRow, MortgageInput, MortgageSummary } from '$lib/types';

const MONTHS_IN_YEAR = 12;

function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateMonthlyPayment(principal: number, annualInterestRate: number, termYears: number): number {
  const months = termYears * MONTHS_IN_YEAR;
  if (months <= 0) {
    throw new Error('Loan term must be greater than zero.');
  }

  const monthlyRate = annualInterestRate / 100 / MONTHS_IN_YEAR;

  if (monthlyRate === 0) {
    return roundToCents(principal / months);
  }

  const factor = Math.pow(1 + monthlyRate, months);
  const payment = (principal * monthlyRate * factor) / (factor - 1);
  return roundToCents(payment);
}

interface ScheduleResult {
  schedule: AmortizationRow[];
  totalInterest: number;
  totalPaid: number;
}

function buildAmortizationSchedule(
  principal: number,
  annualInterestRate: number,
  termYears: number,
  baseMonthlyPayment: number,
  extraMonthlyPayment: number
): ScheduleResult {
  let balance = roundToCents(principal);
  const monthlyRate = annualInterestRate / 100 / MONTHS_IN_YEAR;
  const schedule: AmortizationRow[] = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let month = 1;

  const paymentWithExtra = roundToCents(baseMonthlyPayment + extraMonthlyPayment);
  const maxIterations = termYears * MONTHS_IN_YEAR + MONTHS_IN_YEAR * 10; // guard against infinite loops

  while (balance > 0 && month <= maxIterations) {
    const interestPayment = monthlyRate === 0 ? 0 : roundToCents(balance * monthlyRate);
    let principalPayment = roundToCents(paymentWithExtra - interestPayment);
    let appliedExtra = extraMonthlyPayment;

    if (principalPayment <= 0) {
      throw new Error('Monthly payment is insufficient to cover interest.');
    }

    if (principalPayment > balance) {
      const basePrincipalPortion = roundToCents(baseMonthlyPayment - interestPayment);
      const remainingBalanceAfterBase = roundToCents(balance - basePrincipalPortion);
      const neededExtra = Math.max(0, remainingBalanceAfterBase);

      principalPayment = balance;
      appliedExtra = Math.min(extraMonthlyPayment, neededExtra);
    }

    appliedExtra = Math.min(appliedExtra, principalPayment);
    const basePrincipalContribution = Math.max(0, roundToCents(principalPayment - appliedExtra));

    balance = roundToCents(balance - principalPayment);
    const totalPayment = roundToCents(interestPayment + principalPayment);

    schedule.push({
      month,
      interestPaid: interestPayment,
      principalPaid: basePrincipalContribution,
      extraPayment: roundToCents(appliedExtra),
      totalPayment,
      remainingBalance: Math.max(balance, 0)
    });

    totalInterest = roundToCents(totalInterest + interestPayment);
    totalPaid = roundToCents(totalPaid + totalPayment);

    month += 1;
  }

  return { schedule, totalInterest, totalPaid };
}

export function calculateMortgageSummary(input: MortgageInput): MortgageSummary {
  const { principal, annualInterestRate, termYears } = input;
  const extraMonthlyPayment = Math.max(0, roundToCents(input.extraMonthlyPayment ?? 0));

  if (principal <= 0) {
    throw new Error('Principal must be greater than zero.');
  }
  if (annualInterestRate < 0) {
    throw new Error('Interest rate cannot be negative.');
  }

  const monthlyPayment = calculateMonthlyPayment(principal, annualInterestRate, termYears);

  const baseline = buildAmortizationSchedule(principal, annualInterestRate, termYears, monthlyPayment, 0);
  const scenario = buildAmortizationSchedule(principal, annualInterestRate, termYears, monthlyPayment, extraMonthlyPayment);

  return {
    monthlyPayment,
    extraMonthlyPayment,
    payoffMonths: scenario.schedule.length,
    totalInterest: scenario.totalInterest,
    totalPaid: scenario.totalPaid,
    baselineMonths: baseline.schedule.length,
    interestSaved: roundToCents(baseline.totalInterest - scenario.totalInterest),
    schedule: scenario.schedule
  };
}

export type { ScheduleResult };
